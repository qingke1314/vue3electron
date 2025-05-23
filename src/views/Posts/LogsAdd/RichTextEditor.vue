<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL;
const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  init: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['change', 'onInit', 'update:modelValue']);

const apiKey = 'u329pk89cumiwelx6b2b3sdup46m4f4byvfcfe2ei8g2oj00';
const contentValue = ref(props.modelValue);

watch(
  () => props.modelValue,
  (newValue) => {
    contentValue.value = newValue;
  }
);

const mergedInitOptions = computed(() => {
  const defaultOptions = {
    plugins: 'lists link image table code help emoticons',
    language: 'zh_CN',
    toolbar:
      'code | forecolor backcolor bold italic underline strikethrough link anchor | alignleft aligncenter alignright alignjustify | \
      styleselect formatselect fontselect fontsizeselect | bullist numlist | blockquote subscript superscript removeformat | \
      table image  media charmap emoticons hr pagebreak insertdatetime print preview | fullscreen | bdmap indent2em lineheight formatpainter axupimgs importword kityformula-editor',
    height: '100%',
    automatic_uploads: true,
    // 自定义图片上传处理函数
    images_upload_handler: (blobInfo, progress) =>
      new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', blobInfo.blob(), blobInfo.filename());
        axios
          .post(`${baseURL}/posts/upload-image-custom`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data', // 重要，代表上传文件
              // 添加认证头
              Authorization:
                'Bearer ' + (localStorage.getItem('token') || sessionStorage.getItem('token')), // 添加认证头
            },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.lengthComputable) {
                progress((progressEvent.loaded / progressEvent.total) * 100);
              }
            },
          })
          .then((response) => {
            if (response.data && response.data.location) {
              resolve(response.data.location);
            } else {
              reject('Invalid JSON response or missing location: ' + JSON.stringify(response.data));
            }
          })
          .catch((error) => {
            let errorMessage = 'Image upload failed.';
            if (error.response && error.response.data && error.response.data.error) {
              errorMessage = error.response.data.error.message || error.response.data.error;
            } else if (error.message) {
              errorMessage = error.message;
            }
            reject({ message: errorMessage, remove: true });
          });
      }),
    file_picker_types: 'image media',
    file_picker_types: 'image',
    /* and here's our custom image picker*/
    file_picker_callback: (cb, value, meta) => {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');

      input.addEventListener('change', (e) => {
        const file = e.target.files[0];

        const reader = new FileReader();
        reader.addEventListener('load', () => {
          /*
          Note: Now we need to register the blob in TinyMCEs image blob
          registry. In the next release this part hopefully won't be
          necessary, as we are looking to handle it internally.
        */
          const id = 'blobid' + new Date().getTime();
          const blobCache = tinymce.activeEditor.editorUpload.blobCache;
          const base64 = reader.result.split(',')[1];
          const blobInfo = blobCache.create(id, file, base64);
          blobCache.add(blobInfo);

          /* call the callback and populate the Title field with the file name */
          cb(blobInfo.blobUri(), { title: file.name });
        });
        reader.readAsDataURL(file);
      });

      input.click();
    },
    resize: false,
  };
  return { ...defaultOptions, ...props.init };
});

// 处理编辑器内容变化的事件
const handleChange = (e) => {
  emit('update:modelValue', contentValue.value);
  emit('change', contentValue.value, e);
};

// 处理编辑器初始化完成的事件
const handleInit = (e, editor) => {
  emit('onInit', editor);
};
</script>

<template>
  <Editor
    v-model="contentValue"
    :api-key="apiKey"
    @change="handleChange"
    @init="handleInit"
    :init="mergedInitOptions"
    :disabled="disabled"
  />
</template>

<style scoped></style>

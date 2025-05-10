<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import Editor from '@tinymce/tinymce-vue';

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
      'undo redo | styles | bold italic | ' +
      'alignleft aligncenter alignright alignjustify | ' +
      'outdent indent | numlist bullist | emoticons',
    height: '100%',
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

<template>
  <div class="directory-item" tabindex="0">
    <svg class="item-icon" v-if="directory.icon === 'FolderOpened'" t="1748077304525" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="18971" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M62.659316 898.116869 155.237045 329.102536c1.693495-9.590827 10.725469-16.93495 19.757442-16.93495l713.52591 0 0-84.674752c0-9.590827-7.338479-16.93495-16.93495-16.93495l-429.018743 0L366.923925 120.238148 22.579934 120.238148c-9.596472 0-16.93495 7.344123-16.93495 16.93495L5.644983 881.181918c0 9.590827 7.338479 16.93495 16.93495 16.93495L62.659316 898.116869z" p-id="18972"></path><path d="M998.597574 382.16538 228.057332 382.16538c-9.037619 0-18.063947 7.338479-19.192944 16.370452L121.367144 882.310915c-1.693495 9.037619 4.515987 16.370452 13.54796 16.370452l770.540243 0c9.031974 0 18.063947-7.338479 19.187299-16.370452L1012.145535 398.535832C1013.83903 390.068357 1007.629548 382.16538 998.597574 382.16538z" p-id="18973"></path></svg>
    <svg class="item-icon" v-else t="1748077326482" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="19543" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M658.285714 292.571429V22.857143a120.685714 120.685714 0 0 1 20.553143 16.018286l233.142857 233.142857c5.705143 5.705143 10.861714 12.580571 16.018286 20.553143H658.285714z m-73.142857 18.285714a54.857143 54.857143 0 0 0 54.857143 54.857143H950.857143v603.428571a54.857143 54.857143 0 0 1-54.857143 54.857143h-768A54.857143 54.857143 0 0 1 73.142857 969.142857v-914.285714A54.857143 54.857143 0 0 1 128 0H585.142857v310.857143z" p-id="19544"></path></svg>
    
    <span class="item-name">{{ directory.name }}</span>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue';

const props = defineProps({
  directory: {
    type: Object,
    required: true,
  },
});
</script>

<style scoped lang="scss">
.directory-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  // padding: 5px;
  border-radius: 6px;
  cursor: pointer;
  text-align: center;
  transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;

  .item-icon {
    width: 48px;
    height: 48px;
    margin-bottom: 8px;
    &:hover,
    &:focus {
      fill: var(--el-color-primary-light-3); // 统一使用文件夹的黄色，或根据需要调整
      outline: none;
    }
    fill: var(--el-color-primary); // 统一使用文件夹的黄色，或根据需要调整
  }

  .item-name {
    font-size: 14px;
    color: var(--el-text-color-primary);
    word-break: break-word; // 防止长名称溢出
    display: -webkit-box;
    -webkit-line-clamp: 2; // 最多显示两行
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3; // 调整行高确保两行文本能很好地显示
    max-height: calc(1.3em * 2); // 限制最大高度为两行
  }
}
</style> 
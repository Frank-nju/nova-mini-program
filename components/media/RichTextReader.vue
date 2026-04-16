<!-- src/components/media/RichTextReader.vue -->
<template>
  <view class="rich-reader" :data-work-id="workId" :data-node-binding="nodeBinding" @click="openReader">
    <!-- 入口卡片样式（可根据设计调整） -->
    <view class="entry-card">
      <text class="title">{{ title }}</text>
      <text class="summary">{{ summary }}</text>
    </view>

    <!-- 全屏阅读器弹窗 -->
    <u-popup 
      v-model="showReader" 
      mode="center" 
      :safe-area-inset-bottom="false"
      @close="handlePopupClose"
    >
      <view class="reader-container">
        <scroll-view scroll-y class="content">
          <rich-text :nodes="content"></rich-text>
        </scroll-view>
        <button class="close-btn" @click="closeReader">返回展馆</button>
      </view>
    </u-popup>
  </view>
</template>

<script setup>
import { useReaderPopup } from '@/components/media/useReaderPopup'
import { withMediaContainerBaseProps } from '@/components/media/mediaContainerProps'

// ---------- 标准接口 Props（对齐方案文档）----------
const props = defineProps(withMediaContainerBaseProps({
  // 基础展示字段
  title: { type: String, default: '' },
  summary: { type: String, default: '' },
  content: { type: String, required: true }
}))

const {
  visible: showReader,
  openReader,
  closeReader,
  handlePopupClose
} = useReaderPopup({ onClose: props.onClose })

</script>

<style scoped lang="scss">
@import '@/styles/media-tokens.scss';

.rich-reader,
.reader-container {
  @include nova-media-reader-vars;
}

.entry-card {
  padding: var(--reader-space-card);
  background: var(--reader-color-surface);
  border-radius: var(--reader-radius-card);
  box-shadow: var(--reader-shadow-card);
}

.title {
  display: block;
  color: var(--reader-color-text-primary);
  font-size: var(--reader-font-title);
  font-weight: 600;
}

.summary {
  display: block;
  margin-top: var(--reader-space-button-top);
  color: var(--reader-color-text-secondary);
  font-size: var(--reader-font-summary);
  line-height: 1.5;
}

.reader-container {
  width: var(--reader-size-width);
  height: var(--reader-size-height);
  background: var(--reader-color-surface-reader);
  border-radius: var(--reader-radius-panel);
  padding: var(--reader-space-panel);
}
.content {
  height: calc(var(--reader-size-height) - var(--reader-space-content-offset));
}
.close-btn {
  margin-top: var(--reader-space-button-top);
  background: var(--reader-color-action);
  color: var(--reader-color-action-text);
}
</style>
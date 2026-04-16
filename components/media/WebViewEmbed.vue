<!-- src/components/media/WebViewEmbed.vue -->
<template>
  <view class="webview-embed" :data-work-id="workId" :data-node-binding="nodeBinding" @click="openViewer">
    <view class="entry-card">
      <view class="entry-head">
        <view class="entry-icon">
          <u-icon name="grid-fill" :color="entryIconColorToken" :size="entryIconSizeToken" />
        </view>
        <view class="entry-text">
          <text class="entry-title">{{ title }}</text>
          <text class="entry-summary">{{ summary }}</text>
        </view>
      </view>

      <view class="entry-action">
        <text class="entry-action-text">打开互动 H5</text>
        <u-icon name="arrow-right" :color="actionIconColorToken" :size="actionIconSizeToken" />
      </view>

      <text v-if="digitalHumanRecommendText" class="recommend-text">
        {{ digitalHumanRecommendText }}
      </text>
    </view>
  </view>

  <u-popup
    v-model="showViewer"
    mode="center"
    :safe-area-inset-bottom="false"
    :closeable="false"
    @close="handlePopupClose"
  >
    <view class="viewer-mask">
      <view class="viewer-header">
        <text class="viewer-title">{{ title }}</text>
        <view class="close-btn" @click="closeViewer">
          <u-icon name="close" :color="iconColorToken" :size="closeIconSizeToken" />
        </view>
      </view>

      <view v-if="normalizedSrc" class="web-shell">
        <!-- #ifdef H5 -->
        <iframe class="web-frame" :src="normalizedSrc"></iframe>
        <!-- #endif -->

        <!-- #ifndef H5 -->
        <web-view class="web-frame" :src="normalizedSrc" />
        <!-- #endif -->
      </view>

      <view v-else class="empty-panel">
        <u-icon name="info-circle" :color="iconColorToken" :size="emptyIconSizeToken" />
        <text class="empty-panel-text">未配置可访问链接</text>
      </view>
    </view>
  </u-popup>
</template>

<script setup>
import { useWebViewViewer } from '@/components/media/useWebViewViewer'
import { withMediaContainerBaseProps } from '@/components/media/mediaContainerProps'
import { getMediaStyleTokens } from '@/components/media/mediaStyleTokens'

const props = defineProps(withMediaContainerBaseProps({
  src: { type: String, default: '' },
  title: { type: String, default: '互动 H5' },
  summary: { type: String, default: '点击进入互动内容' }
}))

const {
  iconColorToken,
  entryIconColorToken,
  actionIconColorToken,
  closeIconSizeToken,
  entryIconSizeToken,
  actionIconSizeToken,
  emptyIconSizeToken
} = getMediaStyleTokens('webview')

const {
  normalizedSrc,
  visible: showViewer,
  openViewer,
  closeViewer,
  handlePopupClose
} = useWebViewViewer({
  srcGetter: () => props.src,
  onClose: props.onClose
})
</script>

<style scoped lang="scss">
@import '@/styles/media-tokens.scss';

.webview-embed,
.viewer-mask {
  @include nova-media-webview-vars;
}

.webview-embed {
  width: 100%;
}

.entry-card {
  border-radius: var(--webview-radius-card);
  background: var(--webview-color-surface);
  box-shadow: var(--webview-shadow-card);
  padding: var(--webview-space-xl);
}

.entry-head {
  display: flex;
  align-items: center;
  gap: var(--webview-space-md);
}

.entry-icon {
  width: var(--webview-entry-icon-wrap-size);
  height: var(--webview-entry-icon-wrap-size);
  border-radius: var(--webview-radius-circle);
  background: var(--webview-color-entry-icon-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.entry-text {
  flex: 1;
  min-width: 0;
}

.entry-title {
  display: block;
  color: var(--webview-color-text-primary);
  font-size: var(--webview-font-lg);
  line-height: 1.4;
  font-weight: 600;
}

.entry-summary {
  display: block;
  margin-top: var(--webview-space-xs);
  color: var(--webview-color-text-secondary);
  font-size: var(--webview-font-sm);
  line-height: 1.5;
}

.entry-action {
  margin-top: var(--webview-space-lg);
  padding: var(--webview-space-sm) var(--webview-space-md);
  border-radius: var(--webview-radius-pill);
  background: var(--webview-color-action-bg);
  display: inline-flex;
  align-items: center;
  gap: var(--webview-space-xs);
}

.entry-action-text {
  color: var(--webview-color-action-text);
  font-size: var(--webview-font-sm);
}

.recommend-text {
  display: block;
  margin-top: var(--webview-space-lg);
  color: var(--webview-color-text-secondary);
  font-size: var(--webview-font-xs);
  line-height: 1.5;
}

.viewer-mask {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: var(--webview-color-mask);
  overflow: hidden;
}

.viewer-header {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 2;
  width: 100%;
  padding: calc(var(--status-bar-height, 0px) + var(--webview-header-top)) var(--webview-header-side) var(--webview-header-bottom);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(180deg, var(--webview-color-overlay-header), transparent);
}

.viewer-title {
  color: var(--webview-color-text-inverse);
  font-size: var(--webview-font-md);
  font-weight: 600;
  max-width: var(--webview-title-max-width);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.close-btn {
  width: var(--webview-close-size);
  height: var(--webview-close-size);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--webview-radius-circle);
  background: var(--webview-color-overlay-light);
}

.web-shell {
  width: 100%;
  height: 100%;
  padding-top: calc(var(--status-bar-height, 0px) + var(--webview-content-top));
  box-sizing: border-box;
}

.web-frame {
  width: 100%;
  height: 100%;
  border: 0;
  background: var(--webview-color-surface);
}

.empty-panel {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: var(--webview-space-sm);
}

.empty-panel-text {
  color: var(--webview-color-text-inverse);
  font-size: var(--webview-font-sm);
}
</style>

<!-- src/components/media/SlideViewer.vue -->
<template>
  <view class="slide-viewer" :data-work-id="workId" :data-node-binding="nodeBinding" @click="openViewer">
    <!-- 入口卡片：展示第一页缩略图和总页数 -->
    <view class="entry-card">
      <view class="cover-wrap">
        <image v-if="firstPage" class="cover" :src="firstPage" mode="aspectFill" />
        <view v-else class="cover cover-empty">
          <u-icon name="file-text" :color="emptyIconColorToken" :size="emptyIconSizeToken" />
          <text class="empty-text">暂无幻灯片</text>
        </view>

        <view class="page-badge">
          <text class="page-badge-text">{{ pageCount }} 页</text>
        </view>
      </view>

      <view class="entry-meta">
        <text class="entry-title">{{ title }}</text>
        <text v-if="digitalHumanRecommendText" class="recommend-text">
          {{ digitalHumanRecommendText }}
        </text>
      </view>
    </view>
  </view>

  <!-- 全屏查看器 -->
  <u-popup
    v-model="showViewer"
    mode="center"
    :safe-area-inset-bottom="false"
    :closeable="false"
    @close="handlePopupClose"
  >
    <view class="slide-mask">
      <view class="slide-header">
        <text class="slide-index">{{ currentIndex + 1 }}/{{ pageCount }}</text>
        <view class="close-btn" @click="closeViewer">
          <u-icon name="close" :color="iconColorToken" :size="closeIconSizeToken" />
        </view>
      </view>

      <swiper
        v-if="showViewer && normalizedPages.length"
        class="slide-swiper"
        :current="currentIndex"
        indicator-dots
        :indicator-color="indicatorColorToken"
        :indicator-active-color="indicatorActiveColorToken"
        @change="onSwiperChange"
      >
        <swiper-item v-for="(pageUrl, index) in normalizedPages" :key="`${pageUrl}-${index}`">
          <view class="slide-item">
            <image class="slide-image" :src="pageUrl" mode="aspectFit" />
          </view>
        </swiper-item>
      </swiper>

      <view v-else class="empty-panel">
        <u-icon name="file-text" :color="iconColorToken" :size="emptyIconSizeToken" />
        <text class="empty-panel-text">暂无可查看的幻灯片</text>
      </view>
    </view>
  </u-popup>
</template>

<script setup>
import { useNormalizedStringArray } from '@/components/media/useMediaContainer'
import { useMediaSwiperViewer } from '@/components/media/useMediaSwiperViewer'
import { withMediaContainerBaseProps } from '@/components/media/mediaContainerProps'
import { getMediaStyleTokens } from '@/components/media/mediaStyleTokens'

// ---------- 标准接口 Props（对齐项目媒体组件风格）----------
const props = defineProps(withMediaContainerBaseProps({
  pages: { type: Array, default: () => [] },
  title: { type: String, default: '幻灯片预览' }
}))

const {
  iconColorToken,
  emptyIconColorToken,
  indicatorColorToken,
  indicatorActiveColorToken,
  emptyIconSizeToken,
  closeIconSizeToken
} = getMediaStyleTokens('slide')

const normalizedPages = useNormalizedStringArray(() => props.pages)

const {
  currentIndex,
  visible: showViewer,
  itemCount: pageCount,
  firstItem: firstPage,
  openViewer,
  closeViewer,
  onSwiperChange,
  handlePopupClose
} = useMediaSwiperViewer({
  items: normalizedPages,
  onClose: props.onClose
})
</script>

<style scoped lang="scss">
@import '@/styles/media-tokens.scss';

.slide-viewer,
.slide-mask {
  @include nova-media-slide-vars;
}

.slide-viewer {
  width: 100%;
}

.entry-card {
  overflow: hidden;
  border-radius: var(--slide-radius-card);
  background: var(--slide-color-surface);
  box-shadow: var(--slide-shadow-card);
}

.cover-wrap {
  position: relative;
}

.cover {
  width: 100%;
  height: var(--slide-cover-height);
  display: block;
  background: var(--slide-color-surface-muted);
}

.cover-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: var(--slide-space-sm);
}

.empty-text {
  font-size: var(--slide-font-sm);
  color: var(--slide-color-empty-icon);
}

.page-badge {
  position: absolute;
  right: var(--slide-space-md);
  bottom: var(--slide-space-md);
  padding: var(--slide-space-xxs) var(--slide-space-pill-x);
  border-radius: var(--slide-radius-pill);
  background: var(--slide-color-overlay-strong);
}

.page-badge-text {
  font-size: var(--slide-font-xs);
  color: var(--slide-color-text-inverse);
}

.entry-meta {
  padding: var(--slide-space-lg) var(--slide-space-xl) var(--slide-space-xl);
}

.entry-title {
  display: block;
  color: var(--slide-color-text-primary);
  font-size: var(--slide-font-lg);
  line-height: 1.4;
  font-weight: 600;
}

.recommend-text {
  display: block;
  margin-top: var(--slide-space-xs);
  color: var(--slide-color-text-secondary);
  font-size: var(--slide-font-xs);
  line-height: 1.5;
}

.slide-mask {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: var(--slide-color-mask);
  overflow: hidden;
}

.slide-header {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 2;
  width: 100%;
  padding: calc(var(--status-bar-height, 0px) + var(--slide-header-top)) var(--slide-header-side) var(--slide-header-bottom);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.slide-index {
  padding: var(--slide-space-xxs) var(--slide-space-md);
  border-radius: var(--slide-radius-pill);
  color: var(--slide-color-text-inverse);
  font-size: var(--slide-font-sm);
  background: var(--slide-color-overlay-light);
}

.close-btn {
  width: var(--slide-close-size);
  height: var(--slide-close-size);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--slide-radius-circle);
  background: var(--slide-color-overlay-light);
}

.slide-swiper {
  width: 100%;
  height: 100%;
}

.slide-item {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--slide-body-top) var(--slide-body-side) var(--slide-body-bottom);
  box-sizing: border-box;
}

.slide-image {
  width: 100%;
  height: 100%;
}

.empty-panel {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: var(--slide-space-sm);
}

.empty-panel-text {
  color: var(--slide-color-text-inverse);
  font-size: var(--slide-font-sm);
}
</style>
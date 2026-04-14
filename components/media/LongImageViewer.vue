<!-- src/components/media/LongImageViewer.vue -->
<template>
  <view class="long-image-viewer" :data-work-id="workId" :data-node-binding="nodeBinding" @click="openViewer">
    <view class="entry-card">
      <view class="cover-wrap">
        <image v-if="firstImage" class="cover" :src="firstImage" mode="aspectFill" />
        <view v-else class="cover cover-empty">
          <u-icon name="image" :color="emptyIconColorToken" :size="emptyIconSizeToken" />
          <text class="empty-text">暂无长图</text>
        </view>

        <view class="count-badge">
          <text class="count-text">{{ imageCount }} 页</text>
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

  <u-popup
    v-model="showViewer"
    mode="center"
    :safe-area-inset-bottom="false"
    :closeable="false"
    @close="handlePopupClose"
  >
    <view class="viewer-mask">
      <view class="viewer-header">
        <text class="viewer-index">{{ currentIndex + 1 }}/{{ imageCount }}</text>
        <view class="close-btn" @click="closeViewer">
          <u-icon name="close" :color="iconColorToken" :size="closeIconSizeToken" />
        </view>
      </view>

      <swiper
        v-if="showViewer && normalizedImages.length"
        class="viewer-swiper"
        :current="currentIndex"
        :vertical="true"
        indicator-dots
        :indicator-color="indicatorColorToken"
        :indicator-active-color="indicatorActiveColorToken"
        @change="onSwiperChange"
      >
        <swiper-item v-for="(imageUrl, index) in normalizedImages" :key="`${imageUrl}-${index}`">
          <scroll-view scroll-y class="long-scroll">
            <image class="long-image" :src="imageUrl" mode="widthFix" />
          </scroll-view>
        </swiper-item>
      </swiper>

      <view v-else class="empty-panel">
        <u-icon name="image" :color="iconColorToken" :size="emptyIconSizeToken" />
        <text class="empty-panel-text">暂无可查看长图</text>
      </view>
    </view>
  </u-popup>
</template>

<script setup>
import { useNormalizedStringArray } from '@/components/media/useMediaContainer'
import { useMediaSwiperViewer } from '@/components/media/useMediaSwiperViewer'
import { withMediaContainerBaseProps } from '@/components/media/mediaContainerProps'
import { getMediaStyleTokens } from '@/components/media/mediaStyleTokens'

const props = defineProps(withMediaContainerBaseProps({
  images: { type: Array, default: () => [] },
  title: { type: String, default: '长图阅读' }
}))

const {
  iconColorToken,
  emptyIconColorToken,
  indicatorColorToken,
  indicatorActiveColorToken,
  emptyIconSizeToken,
  closeIconSizeToken
} = getMediaStyleTokens('longImage')

const normalizedImages = useNormalizedStringArray(() => props.images)

const {
  currentIndex,
  visible: showViewer,
  itemCount: imageCount,
  firstItem: firstImage,
  openViewer,
  closeViewer,
  onSwiperChange,
  handlePopupClose
} = useMediaSwiperViewer({
  items: normalizedImages,
  onClose: props.onClose
})
</script>

<style scoped lang="scss">
@import '@/styles/media-tokens.scss';

.long-image-viewer,
.viewer-mask {
  @include nova-media-long-image-vars;
}

.long-image-viewer {
  width: 100%;
}

.entry-card {
  overflow: hidden;
  border-radius: var(--long-image-radius-card);
  background: var(--long-image-color-surface);
  box-shadow: var(--long-image-shadow-card);
}

.cover-wrap {
  position: relative;
}

.cover {
  width: 100%;
  height: var(--long-image-cover-height);
  display: block;
  background: var(--long-image-color-surface-muted);
}

.cover-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: var(--long-image-space-sm);
}

.empty-text {
  color: var(--long-image-color-empty-icon);
  font-size: var(--long-image-font-sm);
}

.count-badge {
  position: absolute;
  right: var(--long-image-space-md);
  bottom: var(--long-image-space-md);
  padding: var(--long-image-space-xxs) var(--long-image-space-pill-x);
  border-radius: var(--long-image-radius-pill);
  background: var(--long-image-color-overlay-strong);
}

.count-text {
  color: var(--long-image-color-text-inverse);
  font-size: var(--long-image-font-xs);
}

.entry-meta {
  padding: var(--long-image-space-lg) var(--long-image-space-xl) var(--long-image-space-xl);
}

.entry-title {
  display: block;
  color: var(--long-image-color-text-primary);
  font-size: var(--long-image-font-lg);
  line-height: 1.4;
  font-weight: 600;
}

.recommend-text {
  display: block;
  margin-top: var(--long-image-space-xs);
  color: var(--long-image-color-text-secondary);
  font-size: var(--long-image-font-xs);
  line-height: 1.5;
}

.viewer-mask {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: var(--long-image-color-mask);
  overflow: hidden;
}

.viewer-header {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 2;
  width: 100%;
  padding: calc(var(--status-bar-height, 0px) + var(--long-image-header-top)) var(--long-image-header-side) var(--long-image-header-bottom);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.viewer-index {
  padding: var(--long-image-space-xxs) var(--long-image-space-md);
  border-radius: var(--long-image-radius-pill);
  color: var(--long-image-color-text-inverse);
  font-size: var(--long-image-font-sm);
  background: var(--long-image-color-overlay-light);
}

.close-btn {
  width: var(--long-image-close-size);
  height: var(--long-image-close-size);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--long-image-radius-circle);
  background: var(--long-image-color-overlay-light);
}

.viewer-swiper {
  width: 100%;
  height: 100%;
}

.long-scroll {
  width: 100%;
  height: 100vh;
  padding: var(--long-image-body-top) var(--long-image-body-side) var(--long-image-body-bottom);
  box-sizing: border-box;
}

.long-image {
  width: 100%;
  display: block;
}

.empty-panel {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: var(--long-image-space-sm);
}

.empty-panel-text {
  color: var(--long-image-color-text-inverse);
  font-size: var(--long-image-font-sm);
}
</style>

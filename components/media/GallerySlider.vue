<!-- src/components/media/GallerySlider.vue -->
<template>
  <view class="gallery-slider" :data-work-id="workId" :data-node-binding="nodeBinding" @click="openGallery">
    <!-- 入口卡片：首图缩略图 + 图片总数 -->
    <view class="entry-card">
      <view class="thumbnail-wrap">
        <image
          v-if="firstImage"
          class="thumbnail"
          :src="firstImage"
          mode="aspectFill"
        />
        <view v-else class="thumbnail thumbnail-empty">
          <u-icon name="image" :color="emptyIconColorToken" :size="emptyIconSizeToken" />
          <text class="empty-text">暂无图片</text>
        </view>
        <view class="count-badge">
          <text class="count-text">{{ imageCount }} 张</text>
        </view>
      </view>

      <view class="entry-meta">
        <text class="entry-title">图片画廊</text>
        <text v-if="digitalHumanRecommendText" class="recommend-text">
          {{ digitalHumanRecommendText }}
        </text>
      </view>
    </view>
  </view>

  <!-- 全屏画廊弹窗 -->
  <u-popup
    v-model="showGallery"
    mode="center"
    :safe-area-inset-bottom="false"
    :closeable="false"
    @close="handlePopupClose"
  >
    <view class="gallery-mask">
      <view class="gallery-header">
        <text class="gallery-index">{{ currentIndex + 1 }}/{{ imageCount }}</text>
        <view class="close-btn" @click="closeGallery">
          <u-icon name="close" :color="iconColorToken" :size="closeIconSizeToken" />
        </view>
      </view>

      <swiper
        v-if="showGallery && normalizedImages.length"
        class="gallery-swiper"
        :current="currentIndex"
        indicator-dots
        :indicator-color="indicatorColorToken"
        :indicator-active-color="indicatorActiveColorToken"
        @change="onSwiperChange"
      >
        <swiper-item v-for="(imageUrl, index) in normalizedImages" :key="`${imageUrl}-${index}`">
          <view class="swiper-item">
            <image class="gallery-image" :src="imageUrl" mode="aspectFit" />
          </view>
        </swiper-item>
      </swiper>

      <view v-else class="empty-gallery">
        <u-icon name="image" :color="iconColorToken" :size="largeIconSizeToken" />
        <text class="empty-gallery-text">暂无可预览图片</text>
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
  images: { type: Array, default: () => [] },
}))

const {
  iconColorToken,
  emptyIconColorToken,
  indicatorColorToken,
  indicatorActiveColorToken,
  emptyIconSizeToken,
  closeIconSizeToken,
  largeIconSizeToken
} = getMediaStyleTokens('gallery')

const normalizedImages = useNormalizedStringArray(() => props.images)

const {
  currentIndex,
  visible: showGallery,
  itemCount: imageCount,
  firstItem: firstImage,
  openViewer: openGallery,
  closeViewer: closeGallery,
  onSwiperChange,
  handlePopupClose
} = useMediaSwiperViewer({
  items: normalizedImages,
  onClose: props.onClose
})
</script>

<style scoped lang="scss">
@import '@/styles/media-tokens.scss';

.gallery-slider,
.gallery-mask {
  @include nova-media-gallery-vars;
}

.gallery-slider {
  width: 100%;
}

.entry-card {
  overflow: hidden;
  border-radius: var(--gallery-radius-card);
  background: var(--gallery-color-surface);
  box-shadow: var(--gallery-shadow-card);
}

.thumbnail-wrap {
  position: relative;
}

.thumbnail {
  width: 100%;
  height: var(--gallery-thumbnail-height);
  display: block;
  background: var(--gallery-color-surface-muted);
}

.thumbnail-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: var(--gallery-space-sm);
  color: var(--gallery-color-text-secondary);
}

.empty-text {
  font-size: var(--gallery-font-size-sm);
  color: var(--gallery-color-empty-icon);
}

.count-badge {
  position: absolute;
  right: var(--gallery-space-md);
  bottom: var(--gallery-space-md);
  padding: var(--gallery-space-xxs) var(--gallery-space-pill-x);
  border-radius: var(--gallery-radius-pill);
  background: var(--gallery-color-overlay-strong);
}

.count-text {
  font-size: var(--gallery-font-size-xs);
  color: var(--gallery-color-text-inverse);
}

.entry-meta {
  padding: var(--gallery-space-lg) var(--gallery-space-xl) var(--gallery-space-xl);
}

.entry-title {
  display: block;
  font-size: var(--gallery-font-size-lg);
  line-height: 1.4;
  color: var(--gallery-color-text-primary);
  font-weight: 600;
}

.recommend-text {
  display: block;
  margin-top: var(--gallery-space-xs);
  font-size: var(--gallery-font-size-xs);
  line-height: 1.5;
  color: var(--gallery-color-text-secondary);
}

.gallery-mask {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: var(--gallery-color-black);
  overflow: hidden;
}

.gallery-header {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 2;
  width: 100%;
  padding: calc(var(--status-bar-height, 0px) + var(--gallery-header-top-padding)) var(--gallery-header-side-padding) var(--gallery-header-bottom-padding);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.gallery-index {
  padding: var(--gallery-space-xxs) var(--gallery-space-md);
  border-radius: var(--gallery-radius-pill);
  font-size: var(--gallery-font-size-sm);
  color: var(--gallery-color-text-inverse);
  background: var(--gallery-color-overlay-light);
  backdrop-filter: blur(var(--gallery-blur-level));
}

.close-btn {
  width: var(--gallery-close-size);
  height: var(--gallery-close-size);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--gallery-radius-circle);
  background: var(--gallery-color-overlay-light);
}

.gallery-swiper {
  width: 100%;
  height: 100%;
}

.swiper-item {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--gallery-image-top-padding) var(--gallery-image-side-padding) var(--gallery-image-bottom-padding);
  box-sizing: border-box;
}

.gallery-image {
  width: 100%;
  height: 100%;
}

.empty-gallery {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: var(--gallery-space-md);
}

.empty-gallery-text {
  font-size: var(--gallery-font-size-md);
  color: var(--gallery-color-text-inverse-soft);
}
</style>
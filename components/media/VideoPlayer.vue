<!-- src/components/media/VideoPlayer.vue -->
<template>
  <view class="video-player" :data-work-id="workId" :data-node-binding="nodeBinding" @click="openPlayer">
    <!-- 入口视频卡片 -->
    <view class="entry-card">
      <image class="poster" :src="poster" mode="aspectFill" />
      <view class="card-overlay">
        <view class="play-btn" @click.stop="openPlayer">
          <u-icon name="play-right-fill" :color="iconColorToken" :size="iconSizePlayToken" />
        </view>
      </view>
      <view class="card-meta">
        <text class="card-title">{{ title }}</text>
        <text class="card-duration">{{ duration }}</text>
      </view>
      <text v-if="digitalHumanRecommendText" class="recommend-text">
        {{ digitalHumanRecommendText }}
      </text>
    </view>
  </view>

  <!-- 全屏播放器弹窗 -->
  <u-popup
    v-model="showPlayer"
    mode="center"
    :safe-area-inset-bottom="false"
    :closeable="false"
    @close="handlePopupClose"
  >
    <view class="player-wrapper">
      <!-- #ifdef MP-WEIXIN -->
      <video
        v-if="showPlayer"
        :id="videoId"
        class="video-core"
        :src="src"
        :poster="poster"
        controls
        :show-fullscreen-btn="true"
        :autoplay="autoplay"
        object-fit="contain"
        @play="onVideoPlay"
        @pause="onVideoPause"
        @timeupdate="onTimeUpdate"
        @ended="onVideoEnded"
      >
        <cover-view class="player-close-cover" @click="closePlayer">
          <cover-view class="player-close-icon">×</cover-view>
        </cover-view>
      </video>
      <!-- #endif -->

      <!-- #ifndef MP-WEIXIN -->
      <!-- 使用 v-if 延迟创建 video，避免页面初始创建过多实例 -->
      <video
        v-if="showPlayer"
        :id="videoId"
        class="video-core"
        :src="src"
        :poster="poster"
        :controls="false"
        :show-fullscreen-btn="false"
        :autoplay="autoplay"
        object-fit="contain"
        @play="onVideoPlay"
        @pause="onVideoPause"
        @timeupdate="onTimeUpdate"
        @ended="onVideoEnded"
      />

      <view class="player-header">
        <text class="player-title">{{ title }}</text>
        <view class="header-close" @click="closePlayer">
          <u-icon name="close" :color="iconColorToken" :size="iconSizeBaseToken" />
        </view>
      </view>

      <!-- 半透明控制栏 -->
      <view class="control-bar">
        <view class="control-btn" @click="togglePlay">
          <u-icon :name="isPlaying ? 'pause' : 'play-right-fill'" :color="iconColorToken" :size="iconSizeBaseToken" />
        </view>

        <slider
          class="progress"
          :value="progress"
          :min="0"
          :max="100"
          :step="1"
          :activeColor="sliderActiveColorToken"
          :backgroundColor="sliderBackgroundColorToken"
          @change="onSeek"
        />

        <text class="time-text">{{ currentText }}/{{ totalText }}</text>

        <view class="control-btn" @click="toggleFullScreen">
          <u-icon :name="isFullScreen ? 'shrink' : 'scan'" :color="iconColorToken" :size="iconSizeSmallToken" />
        </view>
      </view>
      <!-- #endif -->
    </view>
  </u-popup>
</template>

<script setup>
import { computed, nextTick } from 'vue'
import { usePopupContainer } from '@/components/media/useMediaContainer'
import { withMediaContainerBaseProps } from '@/components/media/mediaContainerProps'
import { getMediaStyleTokens } from '@/components/media/mediaStyleTokens'
import { useVideoPlayback } from '@/components/media/useVideoPlayback'

const props = defineProps(withMediaContainerBaseProps({
  src: { type: String, default: '' },
  poster: { type: String, default: '' },
  title: { type: String, default: '' },
  duration: { type: String, default: '' }
}))

const emit = defineEmits(['play', 'ended'])

const sanitizedAnchorId = computed(() => props.anchorId.replace(/[^a-zA-Z0-9_-]/g, '_'))
const videoId = computed(() => `video-player-${sanitizedAnchorId.value || 'default'}`)

const {
  autoplay,
  isPlaying,
  isFullScreen,
  progress,
  currentText,
  totalText,
  bindVideoContext,
  resetPlaybackState,
  togglePlay,
  onSeek,
  toggleFullScreen,
  onVideoPlay,
  onVideoPause,
  onTimeUpdate,
  onVideoEnded
} = useVideoPlayback({
  videoId,
  duration: computed(() => props.duration),
  onPlay: () => emit('play'),
  onEnded: () => emit('ended')
})

const {
  visible: showPlayer,
  open: openContainer,
  close: closeContainer,
  handlePopupClose
} = usePopupContainer({
  onOpen: async () => {
    resetPlaybackState()
    autoplay.value = true
    await nextTick()
    // video 组件挂载后再创建上下文，避免空上下文报错
    bindVideoContext()
  },
  onClose: props.onClose
})

const {
  iconColorToken,
  sliderActiveColorToken,
  sliderBackgroundColorToken,
  iconSizePlayToken,
  iconSizeBaseToken,
  iconSizeSmallToken
} = getMediaStyleTokens('video')

const openPlayer = () => {
  openContainer()
}

const closePlayer = () => {
  closeContainer()
  resetPlaybackState()
}
</script>

<style scoped lang="scss">
@import '@/styles/media-tokens.scss';

.video-player,
.player-wrapper {
  @include nova-media-video-vars;
}

.video-player {
  width: 100%;
}

.entry-card {
  position: relative;
  overflow: hidden;
  border-radius: var(--video-radius-card);
  background: var(--video-color-surface);
  box-shadow: var(--video-shadow-card);
}

.poster {
  width: 100%;
  height: var(--video-poster-height);
  display: block;
  background: var(--video-color-surface-muted);
}

.card-overlay {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: var(--video-poster-height);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, transparent, var(--video-color-overlay-card-end));
}

.play-btn {
  width: var(--video-play-size);
  height: var(--video-play-size);
  border-radius: var(--video-radius-circle);
  background: var(--video-color-overlay-play);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-meta {
  padding: var(--video-space-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--video-space-md);
}

.card-title {
  font-size: var(--video-font-title);
  color: var(--video-color-text-primary);
  font-weight: 600;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-duration {
  font-size: var(--video-font-body);
  color: var(--video-color-text-secondary);
}

.recommend-text {
  display: block;
  padding: 0 var(--video-space-xl) var(--video-space-xl);
  font-size: var(--video-font-body);
  color: var(--video-color-text-tertiary);
  line-height: 1.5;
}

.player-wrapper {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: var(--video-color-mask);
}

.video-core {
  width: 100%;
  height: 100%;
  background: var(--video-color-mask);
}

.player-close-cover {
  position: absolute;
  top: calc(var(--status-bar-height, 0px) + var(--video-header-top-extra));
  right: var(--video-header-side);
  width: var(--video-header-close-size);
  height: var(--video-header-close-size);
  border-radius: var(--video-radius-circle);
  background: var(--video-color-overlay-control-light);
  display: flex;
  align-items: center;
  justify-content: center;
}

.player-close-icon {
  color: var(--video-color-text-inverse);
  font-size: 34rpx;
  line-height: 1;
}

.player-header {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: calc(var(--status-bar-height, 0px) + var(--video-header-top-extra)) var(--video-header-side) var(--video-header-bottom);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(180deg, var(--video-color-overlay-header), transparent);
}

.player-title {
  color: var(--video-color-text-inverse);
  font-size: var(--video-font-title);
  max-width: var(--video-title-max-width);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-close {
  width: var(--video-header-close-size);
  height: var(--video-header-close-size);
  border-radius: var(--video-radius-circle);
  background: var(--video-color-overlay-control-light);
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-bar {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  padding: var(--video-space-lg) var(--video-space-xl) calc(env(safe-area-inset-bottom) + var(--video-space-md));
  box-sizing: border-box;
  background: var(--video-color-overlay-control);
  display: flex;
  align-items: center;
  gap: var(--video-space-control-gap);
}

.control-btn {
  width: var(--video-control-size);
  height: var(--video-control-size);
  border-radius: var(--video-radius-circle);
  background: var(--video-color-overlay-control-light);
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress {
  flex: 1;
}

.time-text {
  color: var(--video-color-text-inverse);
  font-size: var(--video-font-time);
  min-width: var(--video-time-min-width);
  text-align: center;
}
</style>
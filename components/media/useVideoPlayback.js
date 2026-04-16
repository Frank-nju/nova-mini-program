import { computed, ref } from 'vue'

const formatTime = (seconds) => {
  const sec = Math.max(0, Math.floor(seconds || 0))
  const min = Math.floor(sec / 60)
  const rest = sec % 60
  const mm = String(min).padStart(2, '0')
  const ss = String(rest).padStart(2, '0')
  return `${mm}:${ss}`
}

export const useVideoPlayback = ({ videoId, duration, onPlay, onEnded }) => {
  const autoplay = ref(false)
  const isPlaying = ref(false)
  const isFullScreen = ref(false)
  const hasEnded = ref(false)
  const currentSec = ref(0)
  const totalSec = ref(0)
  const videoCtx = ref(null)

  const progress = computed(() => {
    if (!totalSec.value) {
      return 0
    }
    return Math.min(100, Math.round((currentSec.value / totalSec.value) * 100))
  })

  const currentText = computed(() => formatTime(currentSec.value))

  const totalText = computed(() => {
    if (totalSec.value > 0) {
      return formatTime(totalSec.value)
    }
    return duration.value || '00:00'
  })

  const resetPlaybackState = () => {
    autoplay.value = false
    isPlaying.value = false
    isFullScreen.value = false
    hasEnded.value = false
    currentSec.value = 0
    totalSec.value = 0
    videoCtx.value = null
  }

  const bindVideoContext = () => {
    videoCtx.value = uni.createVideoContext(videoId.value)
  }

  const restartPlayback = () => {
    if (!videoCtx.value) {
      return
    }

    hasEnded.value = false
    currentSec.value = 0
    videoCtx.value.seek(0)
    setTimeout(() => {
      if (videoCtx.value) {
        videoCtx.value.play()
      }
    }, 0)
  }

  const togglePlay = () => {
    if (!videoCtx.value) {
      return
    }

    if (hasEnded.value || (totalSec.value > 0 && currentSec.value >= totalSec.value - 1)) {
      restartPlayback()
      return
    }

    if (isPlaying.value) {
      videoCtx.value.pause()
    } else {
      videoCtx.value.play()
    }
  }

  const onSeek = (event) => {
    if (!videoCtx.value || !totalSec.value) {
      return
    }

    const seekSec = Math.floor((event.detail.value / 100) * totalSec.value)
    hasEnded.value = false
    currentSec.value = seekSec
    videoCtx.value.seek(seekSec)
  }

  const toggleFullScreen = () => {
    if (!videoCtx.value) {
      return
    }

    if (!isFullScreen.value) {
      if (typeof videoCtx.value.requestFullScreen === 'function') {
        // #ifdef MP-WEIXIN
        videoCtx.value.requestFullScreen({ direction: 90 })
        // #endif
        // #ifndef MP-WEIXIN
        videoCtx.value.requestFullScreen()
        // #endif
        isFullScreen.value = true
      }
      return
    }

    if (typeof videoCtx.value.exitFullScreen === 'function') {
      videoCtx.value.exitFullScreen()
      isFullScreen.value = false
    }
  }

  const onVideoPlay = () => {
    isPlaying.value = true
    hasEnded.value = false
    if (typeof onPlay === 'function') {
      onPlay()
    }
  }

  const onVideoPause = () => {
    isPlaying.value = false
  }

  const onTimeUpdate = (event) => {
    currentSec.value = Number(event.detail.currentTime || 0)
    totalSec.value = Number(event.detail.duration || 0)
  }

  const onVideoEnded = () => {
    isPlaying.value = false
    hasEnded.value = true
    currentSec.value = totalSec.value
    if (typeof onEnded === 'function') {
      onEnded()
    }
  }

  return {
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
  }
}

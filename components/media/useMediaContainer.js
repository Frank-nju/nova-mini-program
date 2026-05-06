import { computed, ref } from 'vue'

export const useNormalizedStringArray = (getter) => computed(() => {
  const source = typeof getter === 'function' ? getter() : []
  if (!Array.isArray(source)) {
    return []
  }
  return source.filter((item) => typeof item === 'string' && item.trim())
})

export const useTrimmedString = (getter) => computed(() => {
  const value = typeof getter === 'function' ? getter() : ''
  if (typeof value !== 'string') {
    return ''
  }
  return value.trim()
})

export const usePopupContainer = ({ canOpen, onOpen, onClose }) => {
  const visible = ref(false)
  const closeLocked = ref(false)

  const open = async () => {
    if (typeof canOpen === 'function' && !canOpen()) {
      return false
    }

    visible.value = true
    closeLocked.value = false

    if (typeof onOpen === 'function') {
      await onOpen()
    }

    return true
  }

  const close = () => {
    visible.value = false

    if (!closeLocked.value) {
      closeLocked.value = true
      if (typeof onClose === 'function') {
        onClose()
      }
    }
  }

  return {
    visible,
    open,
    close,
    handlePopupClose: close
  }
}

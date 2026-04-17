import { computed, ref } from 'vue'
import { usePopupContainer } from '@/components/media/useMediaContainer'

export const useMediaSwiperViewer = ({ items, onClose }) => {
  const currentIndex = ref(0)

  const {
    visible,
    open,
    close,
    handlePopupClose
  } = usePopupContainer({
    canOpen: () => items.value.length > 0,
    onClose
  })

  const itemCount = computed(() => items.value.length)
  const firstItem = computed(() => items.value[0] || '')

  const openViewer = () => {
    currentIndex.value = 0
    open()
  }

  const closeViewer = () => {
    close()
  }

  const onSwiperChange = (event) => {
    currentIndex.value = Number(event.detail.current || 0)
  }

  return {
    currentIndex,
    visible,
    itemCount,
    firstItem,
    openViewer,
    closeViewer,
    onSwiperChange,
    handlePopupClose
  }
}

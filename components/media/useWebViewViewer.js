import { usePopupContainer, useTrimmedString } from '@/components/media/useMediaContainer'

export const useWebViewViewer = ({ srcGetter, onClose }) => {
  const normalizedSrc = useTrimmedString(srcGetter)

  const {
    visible,
    open,
    close,
    handlePopupClose
  } = usePopupContainer({
    canOpen: () => Boolean(normalizedSrc.value),
    onClose
  })

  const openViewer = () => {
    open()
  }

  const closeViewer = () => {
    close()
  }

  return {
    normalizedSrc,
    visible,
    openViewer,
    closeViewer,
    handlePopupClose
  }
}

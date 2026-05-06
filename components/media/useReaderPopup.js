import { usePopupContainer } from '@/components/media/useMediaContainer'

export const useReaderPopup = ({ onClose }) => {
  const {
    visible,
    open,
    close,
    handlePopupClose
  } = usePopupContainer({ onClose })

  const openReader = () => {
    open()
  }

  const closeReader = () => {
    close()
  }

  return {
    visible,
    openReader,
    closeReader,
    handlePopupClose
  }
}

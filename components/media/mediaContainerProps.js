export const mediaContainerBaseProps = {
  workId: { type: String, required: true },
  anchorId: { type: String, required: true },
  onClose: { type: Function, default: () => {} },
  nodeBinding: { type: String, default: '' },
  slot: { type: String, default: 'scroll_embed' },
  digitalHumanRecommendText: { type: String, default: '' }
}

export const withMediaContainerBaseProps = (extraProps = {}) => ({
  ...extraProps,
  ...mediaContainerBaseProps
})

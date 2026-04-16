const toCssVar = (tokenName) => `var(--${tokenName})`

const styleTokenNamesByType = {
  gallery: {
    iconColorToken: 'gallery-color-icon',
    emptyIconColorToken: 'gallery-color-empty-icon',
    indicatorColorToken: 'gallery-color-indicator',
    indicatorActiveColorToken: 'gallery-color-indicator-active',
    emptyIconSizeToken: 'gallery-size-icon-empty',
    closeIconSizeToken: 'gallery-size-icon-close',
    largeIconSizeToken: 'gallery-size-icon-large'
  },
  slide: {
    iconColorToken: 'slide-color-icon',
    emptyIconColorToken: 'slide-color-empty-icon',
    indicatorColorToken: 'slide-color-indicator',
    indicatorActiveColorToken: 'slide-color-indicator-active',
    emptyIconSizeToken: 'slide-icon-empty-size',
    closeIconSizeToken: 'slide-icon-close-size'
  },
  longImage: {
    iconColorToken: 'long-image-color-icon',
    emptyIconColorToken: 'long-image-color-empty-icon',
    indicatorColorToken: 'long-image-color-indicator',
    indicatorActiveColorToken: 'long-image-color-indicator-active',
    emptyIconSizeToken: 'long-image-icon-empty-size',
    closeIconSizeToken: 'long-image-icon-close-size'
  },
  webview: {
    iconColorToken: 'webview-color-icon',
    entryIconColorToken: 'webview-color-entry-icon',
    actionIconColorToken: 'webview-color-action-icon',
    closeIconSizeToken: 'webview-icon-close-size',
    entryIconSizeToken: 'webview-icon-entry-size',
    actionIconSizeToken: 'webview-icon-action-size',
    emptyIconSizeToken: 'webview-icon-empty-size'
  },
  video: {
    iconColorToken: 'video-color-icon',
    sliderActiveColorToken: 'video-color-slider-active',
    sliderBackgroundColorToken: 'video-color-slider-track',
    iconSizePlayToken: 'video-size-icon-play',
    iconSizeBaseToken: 'video-size-icon-base',
    iconSizeSmallToken: 'video-size-icon-small'
  }
}

export const getMediaStyleTokens = (type) => {
  const names = styleTokenNamesByType[type] || {}
  return Object.keys(names).reduce((result, key) => {
    result[key] = toCssVar(names[key])
    return result
  }, {})
}

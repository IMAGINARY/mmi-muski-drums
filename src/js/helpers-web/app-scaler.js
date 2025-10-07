/**
 * AppScaler class
 *
 * This class is used to scale the app element to fit within the viewport.
 * It preserves the aspect ratio of the app element and ensures that it is centered.
 */
export default class AppScaler {
  constructor($appElement) {
    this.$appElement = $appElement;
    this.$element = $('<div></div>')
      .addClass('app-scaler');
    this.$element.append(this.$appElement);

    $(window).on('resize', this.handleResize.bind(this));
    this.handleResize();
  }

  /**
   * Refresh the app scaler.
   */
  handleResize() {
    const appWidth = this.$appElement.outerWidth();
    const appHeight = this.$appElement.outerHeight();
    const viewportWidth = $(window).width();
    const viewportHeight = $(window).height();

    // Calculate the scale factor
    const scaleFactor = Math.min(viewportWidth / appWidth, viewportHeight / appHeight);

    // Set the scale factor and center the app element using jQuery
    this.$element.css({
      transform: `scale(${scaleFactor})`,
      transformOrigin: 'top left',
      left: `${Math.round((viewportWidth - appWidth * scaleFactor) / 2)}px`,
      top: `${Math.round((viewportHeight - appHeight * scaleFactor) / 2)}px`,
      position: 'absolute',
    });
  }

  refresh() {
    this.handleResize();
  }
}

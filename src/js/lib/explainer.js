const EventEmitter = require('events');

export default class Explainer {
  constructor(content) {
    this.$element = $('<div></div>')
      .addClass('explainer');
    this.events = new EventEmitter();

    const $container = $('<div></div>')
      .addClass('container-fluid')
      .appendTo(this.$element);

    const $row = $('<div></div>')
      .addClass('row')
      .appendTo($container);

    this.$content = $('<div></div>')
      .addClass(['col', 'explainer-content'])
      .html(content)
      .appendTo($row);
  }
}

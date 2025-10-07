export default class PatternDiagram {
  /**
   * PatternDiagram constructor
   *
   * @param {number} rows
   * @param {number} cols
   * @param {Array} pattern
   *   The pattern should be an array of arrays, where each inner array represents a row
   *   and each element in the inner array represents a column. Elements that have truthy
   *   values are considered part of the pattern.
   */
  constructor(rows, cols, pattern) {
    this.$element = $('<div>')
      .addClass('pattern-diagram');
    this.rows = rows;
    this.cols = cols;
    this.pattern = pattern;

    this.render();
  }

  clear() {
    this.$element.empty();
  }

  render() {
    this.clear();
    const $table = $('<table>');
    const $tbody = $('<tbody>');
    for (let row = 0; row < this.rows; row += 1) {
      const $tr = $('<tr>');
      for (let col = 0; col < this.cols; col += 1) {
        const $td = $('<td>');
        if (this.pattern[row] && this.pattern[row][col]) {
          $td.addClass('active');
        }
        $tr.append($td);
      }
      $tbody.append($tr);
    }
    $table.append($tbody);
    this.$element.append($table);
  }

  static createElement(rows, cols, pattern) {
    const diagram = new PatternDiagram(rows, cols, pattern);
    return diagram.$element;
  }
}

export default class IdleMonitor {
  constructor(timeoutSeconds, callback, autoRestart = true) {
    if (typeof timeoutSeconds !== 'number' || timeoutSeconds < 0) {
      throw new Error('IdleMonitor: timeoutSeconds must be a non-negative number.');
    }
    if (typeof callback !== 'function') {
      throw new Error('IdleMonitor: callback must be a function.');
    }
    if (typeof autoRestart !== 'boolean') {
      throw new Error('IdleMonitor: autoRestart must be a boolean.');
    }

    this.timeoutMs = timeoutSeconds * 1000;
    this.onIdle = callback;
    this.timer = null;
    this.idle = false;
    this.autoRestart = autoRestart;

    this.$target = $(document);
    this.events = [
      'mousedown.idleMonitor',
      'keydown.idleMonitor',
      'touchstart.idleMonitor',
      'wheel.idleMonitor',
      'scroll.idleMonitor',
      'pointerdown.idleMonitor',
    ].join(' ');

    this.onActivity = this.onActivity.bind(this);
    this.bound = false;

    this.start();
  }

  start() {
    if (!this.bound) {
      this.$target.on(this.events, this.onActivity);
      this.bound = true;
    }
    this.reset();
  }

  stop() {
    if (this.bound) {
      this.$target.off(this.events, this.onActivity);
      this.bound = false;
    }
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  destroy() {
    this.stop();
    this.$target = null;
    this.onIdle = null;
  }

  reset() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.timer = setTimeout(() => this.goIdle(), this.timeoutMs);
  }

  onActivity() {
    if (this.idle) {
      this.idle = false;
    }
    this.reset();
  }

  goIdle() {
    this.timer = null;
    this.idle = true;
    this.onIdle();

    if (this.autoRestart) {
      // Reset idle so subsequent cycles represent a new check.
      this.idle = false;
      this.timer = setTimeout(() => this.goIdle(), this.timeoutMs);
    }
  }
}

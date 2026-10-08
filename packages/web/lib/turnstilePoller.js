export class TurnstilePoller {
  constructor(options = {}) {
    this.maxAttempts = options.maxAttempts ?? 50; // 50 * 300ms = 15s timeout
    this.intervalMs = options.intervalMs ?? 300;
    this.attempts = 0;
    this.timer = null;
    this.onError = options.onError || (() => {});
    this.onReady = options.onReady || (() => {});
  }

  poll(isReadyFn, onRenderFn) {
    if (isReadyFn()) {
      onRenderFn();
      this.onReady();
      return;
    }
    this.attempts++;
    if (this.attempts >= this.maxAttempts) {
      this.onError(
        "Turnstile widget failed to load — please check your connection or ad blocker and refresh."
      );
      return;
    }
    this.timer = setTimeout(() => this.poll(isReadyFn, onRenderFn), this.intervalMs);
  }

  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

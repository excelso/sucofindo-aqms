class ExIntervalTimer {
    private intervalId: NodeJS.Timeout | null = null;
    private remainingTime: number;
    private intervalDuration: number;
    private startTime: number | null = null;
    private isPaused: boolean = false;

    constructor(intervalDuration: number) {
        this.intervalDuration = intervalDuration;
        this.remainingTime = intervalDuration;
    }

    // Start or resume the timer
    start(callback: () => void): void {
        if (this.isPaused && this.remainingTime > 0) {
            this.resume(callback);
            return;
        }

        if (this.intervalId !== null) {
            console.warn("Timer is already running.");
            return;
        }

        this.startTime = Date.now();
        this.intervalId = setTimeout(() => {
            callback();
            this.clear(); // Clear the timer after execution
        }, this.remainingTime);
    }

    // Stop the timer and reset
    stop(): void {
        if (this.intervalId !== null) {
            clearTimeout(this.intervalId);
            this.intervalId = null;
        }
        this.remainingTime = this.intervalDuration;
        this.isPaused = false;
        this.startTime = null;
    }

    // Pause the timer
    pause(): void {
        if (this.intervalId === null || this.isPaused) {
            console.warn("Timer is not running or already paused.");
            return;
        }

        clearTimeout(this.intervalId);
        this.intervalId = null;
        this.remainingTime -= Date.now() - (this.startTime || 0);
        this.isPaused = true;
    }

    // Resume the timer after pausing
    private resume(callback: () => void): void {
        if (!this.isPaused) {
            console.warn("Timer is not paused.");
            return;
        }

        this.startTime = Date.now();
        this.intervalId = setTimeout(() => {
            callback();
            this.clear();
        }, this.remainingTime);
        this.isPaused = false;
    }

    // Clear the timer without resetting duration
    clear(): void {
        if (this.intervalId !== null) {
            clearTimeout(this.intervalId);
            this.intervalId = null;
        }
        this.isPaused = false;
        this.startTime = null;
    }
}

export default ExIntervalTimer;

export default class ExTimer {
    private seconds: number = 0;
    private minutes: number = 0;
    private hours: number = 0;
    private readonly element: HTMLElement;
    private intervalId: number | null = null;

    constructor(element: HTMLElement) {
        this.element = element;

        const now = new Date();
        this.hours = now.getHours();
        this.minutes = now.getMinutes();
        this.seconds = now.getSeconds();
        this.updateDisplay();
    }

    private updateDisplay(): void {
        const displayHours = this.hours.toString().padStart(2, '0');
        const displayMinutes = this.minutes.toString().padStart(2, '0');
        const displaySeconds = this.seconds.toString().padStart(2, '0');

        if (this.element) {
            this.element.textContent = `${displayHours}:${displayMinutes}`;
        }
    }

    private updateTime(): void {
        this.seconds++;

        if (this.seconds >= 60) {
            this.seconds = 0;
            this.minutes++;

            if (this.minutes >= 60) {
                this.minutes = 0;
                this.hours++;
            }
        }

        this.updateDisplay();
    }

    start(): void {
        if (!this.intervalId) {
            this.intervalId = window.setInterval(() => this.updateTime(), 1000);
        }
    }

    stop(): void {
        if (this.intervalId) {
            window.clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    reset(): void {
        this.stop();
        const now = new Date();
        this.hours = now.getHours();
        this.minutes = now.getMinutes();
        this.seconds = now.getSeconds();
        this.updateDisplay();
    }

    getTime(): string {
        return this.element.textContent || '00:00:00';
    }
}

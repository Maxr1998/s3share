/**
 * Simple speed tracker using an exponential moving average.
 */
export class SpeedTracker {
    private speed: number = 0
    private lastTime: number = Date.now()
    private lastBytes: number = 0
    private readonly callback: (speed: number) => void

    constructor(callback: (speed: number) => void) {
        this.callback = callback
    }

    update(bytes: number) {
        const now = Date.now()
        const dt = (now - this.lastTime) / 1000
        if (dt >= 0.25) {
            const instant = (bytes - this.lastBytes) / dt
            this.speed = this.speed === 0 ? instant : this.speed * 0.7 + instant * 0.3
            this.lastTime = now
            this.lastBytes = bytes
            this.callback(this.speed)
        }
    }

    reset() {
        this.speed = 0
        this.lastTime = Date.now()
        this.lastBytes = 0
    }
}

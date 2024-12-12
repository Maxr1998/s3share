export class ProgressTracker {
    private progress: number
    private readonly total: number
    private readonly callback: (progress: number, total: number) => void

    constructor(total: number, callback: (progress: number, total: number) => void) {
        this.total = total
        this.progress = 0
        this.callback = callback
    }

    update(loaded: number) {
        this.progress += loaded
        this.callback(this.progress, this.total)
    }
}
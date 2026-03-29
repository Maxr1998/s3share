// Errors
export const INVALID_KEY = "Invalid decryption key - please ensure you copied the full, correct link."
export const INVALID_UPLOAD_URL = "Invalid URL - you must provide a valid upload token in the URL."
export const FETCH_FAILED = 'FETCH_FAILED'

/**
 * The current state of a download.
 */
export enum DownloadState {
    Idle,
    Downloading,
    Completed,
    Failure,
}

/**
 * The current state of an upload.
 */
export enum UploadState {
    Idle,
    Preparing,
    Uploading,
    Completed,
    Failure,
}
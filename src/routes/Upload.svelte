<div>
    {#if uploadState === UploadState.Idle}
        <p class="description">
            Upload a file to share it securely.
            Your file will be encrypted locally and the server will never see its contents.
        </p>
        <button type="button" onclick="{chooseFile}">Choose file</button>
    {:else if fileToUpload !== null}
        {#if uploadState === UploadState.Preparing}
            <p class="status-header">Preparing to upload {fileToUpload.name}…</p>
        {:else if uploadState === UploadState.Uploading}
            <p class="status-header">Uploading {fileToUpload.name}</p>
            <div class="progress-container">
                <TransferProgress bytes={uploadBytes} total={fileToUpload.size} speed={uploadSpeed}/>
            </div>
        {:else if uploadState === UploadState.Completed}
            <p class="status-header">Upload complete!</p>
            <p class="redirect-hint">Redirecting to download page in {redirectTime}&nbsp;s…</p>
        {:else if uploadState === UploadState.Failure}
            <p class="error">Upload failed</p>
            <p class="error-message description">
                An error occurred while uploading your file:<br/>
                {error}
            </p>
            <button type="button" onclick="{() => uploadState = UploadState.Idle}">Retry</button>
        {/if}
    {/if}
</div>

<style>
    .description {
        font-size: 0.9rem;
        opacity: 0.55;
    }

    .status-header {
        font-size: 1.25rem;
        font-weight: 600;
    }

    button {
        margin-top: 2rem;
    }

    .progress-container {
        margin-top: 2rem;
    }

    .redirect-hint {
        margin-top: 2rem;
        font-size: 0.9rem;
        opacity: 0.55;
    }

    .error {
        font-size: 1.25rem;
        font-weight: 600;
    }

    .error-message {
        margin-top: 0.5rem;
    }
</style>

<script lang="ts">
    import TransferProgress from "../components/TransferProgress.svelte"
    import {UploadState} from "../constants"
    import {UploadManager} from "../upload/manager"
    import {getEncryptionKey, getUploadToken} from "../upload/url"
    import {pickUploadFile} from "../utils/file"
    import {ProgressTracker} from "../utils/progress"
    import {SpeedTracker} from "../utils/speed"

    let uploadState = $state(UploadState.Idle)
    let fileToUpload = $state<File | null>(null)

    let uploadBytes = $state(0)
    let uploadSpeed = $state(0)

    let redirectTime = $state(3)

    let error = $state()

    async function chooseFile() {
        const file = await pickUploadFile()
        if (file) {
            await upload(file)
        }
    }

    async function upload(file: File) {
        fileToUpload = file

        try {
            uploadState = UploadState.Preparing

            uploadBytes = 0
            uploadSpeed = 0

            const speedTracker = new SpeedTracker((speed) => uploadSpeed = speed)
            const progressTracker = new ProgressTracker(file.size, (progress) => {
                uploadBytes = progress
                speedTracker.update(progress)
            })

            const uploadToken = await getUploadToken()
            const encryptionKey = await getEncryptionKey()

            const uploadManager = new UploadManager(uploadToken, encryptionKey, file, progressTracker)

            await uploadManager.prepare()
            uploadState = UploadState.Uploading
            await uploadManager.upload()
            uploadState = UploadState.Completed

            await redirectAfterDelay(uploadManager.downloadPath)
        } catch (e) {
            console.error(e)
            error = e
            uploadState = UploadState.Failure
        }
    }

    async function redirectAfterDelay(path: string, delay: number = 3) {
        redirectTime = delay
        while (redirectTime > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            redirectTime--
        }

        window.location.href = path
    }
</script>
<div>
    {#if uploadState.type === "Idle"}
        <p class="description">
            Upload a file to share it securely.
            Your file will be encrypted locally and the server will never see its contents.
        </p>
        <button type="button" onclick="{initiateUpload}">Choose file</button>
    {:else if uploadState.type === "Preparing"}
        <p class="status-header">Preparing to upload {uploadState.file.name}…</p>
    {:else if uploadState.type === "Uploading"}
        <p class="status-header">Uploading {uploadState.file.name}</p>
        <div class="progress-container">
            <TransferProgress bytes={uploadBytes} total={uploadState.file.size} speed={uploadSpeed}/>
        </div>
    {:else if uploadState.type === "Completed"}
        <p class="status-header">Upload complete!</p>
        <p class="redirect-hint">Redirecting to download page in {redirectTime}&nbsp;s…</p>
    {:else if uploadState.type === "Failure"}
        <p class="error">Upload failed</p>
        <p class="error-message description">
            An error occurred while uploading your file:<br/>
            {uploadState.error}
        </p>
        <button type="button" onclick="{retry}">Retry</button>
    {:else if uploadState.type === "InvalidToken"}
        <p class="error">Invalid upload URL</p>
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
    import {onMount} from "svelte"
    import TransferProgress from "../components/TransferProgress.svelte"
    import {type UploadState} from "../constants"
    import {UploadManager} from "../upload/manager"
    import {getEncryptionKey, getUploadToken} from "../upload/url"
    import {pickUploadFile} from "../utils/file"
    import {ProgressTracker} from "../utils/progress"
    import {SpeedTracker} from "../utils/speed"

    let uploadState = $state<UploadState>({type: "Loading"})

    let uploadBytes = $state(0)
    let uploadSpeed = $state(0)

    let redirectTime = $state(3)

    onMount(async () => {
        try {
            const token = getUploadToken()
            const key = await getEncryptionKey()

            uploadState = {type: "Idle", token, key}
        } catch (e) {
            console.error(e)
            uploadState = {type: "InvalidToken", error: e}
        }
    })

    async function initiateUpload() {
        // Ensure we're idle before allowing to pick a file
        if (uploadState.type !== "Idle") return

        // Store token and key for the current session
        const uploadToken = uploadState.token
        const encryptionKey = uploadState.key

        const file = await pickUploadFile()
        if (!file) return

        uploadState = {type: "Preparing", token: uploadToken, key: encryptionKey, file}

        uploadBytes = 0
        uploadSpeed = 0

        const speedTracker = new SpeedTracker((speed) => uploadSpeed = speed)
        const progressTracker = new ProgressTracker(file.size, (progress) => {
            uploadBytes = progress
            speedTracker.update(progress)
        })

        try {
            const uploadManager = new UploadManager(uploadToken, encryptionKey, file, progressTracker)
            await uploadManager.prepare()

            uploadState = {type: "Uploading", file, token: uploadToken, key: encryptionKey}
            await uploadManager.upload()

            uploadState = {type: "Completed"}
            await redirectAfterDelay(uploadManager.downloadPath)
        } catch (e) {
            console.error(e)
            uploadState = {type: "Failure", error: e, token: uploadToken, key: encryptionKey}
        }
    }

    function retry() {
        if (uploadState.type === "Failure") {
            uploadState = {type: "Idle", token: uploadState.token, key: uploadState.key}
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
<div class="card">
    <h3>Upload file</h3>
    {#if uploadState === UploadState.Idle}
        <button type="button" onclick="{chooseFile}">Choose file for upload</button>
        {#if selectedFile}
            <p>Selected: {selectedFile.name}</p>
            <p>Size: {prettyBytes(selectedFile.size)}</p>
            {#if selectedFile.type}
                <p>Type: <code>{selectedFile.type}</code></p>
            {/if}
        {/if}
    {:else if uploadState === UploadState.Preparing}
        <p>Preparing to upload...</p>
    {:else if uploadState === UploadState.Uploading}
        <p>Uploading...</p>
    {:else if uploadState === UploadState.Completed}
        <p>Upload complete!</p>
        <p>
            <i>Redirecting to download page… {redirectTime}s</i>
        </p>
    {/if}
</div>

<style>
    h3 {
        margin: 0;
    }

    p {
        margin: 6px 0 0 0;
    }

    button {
        margin-top: 0.75rem;
    }

    code {
        background: var(--chip-color);
        border-radius: 4px;
        padding: 0.1rem 0.35rem;
    }
</style>

<script lang="ts">
    import prettyBytes from "pretty-bytes"
    import {pickUploadFile} from "../utils/file"
    import {UploadState} from "../constants"
    import {getEncryptionKey, getUploadToken} from "../upload/url"
    import {UploadManager} from "../upload/manager"

    let uploadState = $state(UploadState.Idle)
    let selectedFile = $state<File | null>(null)
    let redirectTime = $state(3)

    async function chooseFile() {
        selectedFile = await pickUploadFile()

        if (selectedFile) {
            await upload(selectedFile)
        }
    }

    async function upload(file: File) {
        uploadState = UploadState.Preparing

        const uploadToken = await getUploadToken()
        const encryptionKey = await getEncryptionKey()

        const uploadManager = new UploadManager(uploadToken, encryptionKey, file)

        await uploadManager.prepare()

        uploadState = UploadState.Uploading

        // TODO: Merge these two calls
        await uploadManager.upload()
        await uploadManager.complete()

        uploadState = UploadState.Completed

        while (redirectTime > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            redirectTime--
        }

        window.location.href = uploadManager.downloadPath
    }
</script>
<div>
    <h1>S3share</h1>
    <div class="card">
        {#if error}
            <p class="error">{error}</p>
        {:else if downloadInfo}
            {#if downloading === DownloadState.Idle}
                <button type="button" onclick="{download}">Download {downloadInfo.name} ({prettyBytes(downloadInfo.size)})</button>
            {:else if downloading === DownloadState.Downloading}
                <p>Downloading...{downloadProgress}</p>
            {:else if downloading === DownloadState.Completed}
                <p>Successfully downloaded {downloadInfo.name}.</p>
            {:else if downloading === DownloadState.Failure}
                <p>Download failed</p>
            {/if}
            {#if downloading === DownloadState.Idle || downloading === DownloadState.Completed}
                <div class="checksum-box">
                    <h5>MD5 checksum (click to copy):</h5>
                    <span class="checksum"
                          onclick="{copyChecksum}"
                          onkeydown="{(e) => {e.key === 'Enter' && copyChecksum()}}"
                          role="button"
                          tabindex="0">{downloadInfo.checksum}</span>
                </div>
            {/if}
        {:else}
            <p>Loading file information...</p>
        {/if}
    </div>
</div>

<style>
    p {
        margin: 6px 0 0 0;
    }

    .checksum-box {
        margin: 1.5em 0 0 0;
    }

    .checksum-box h5 {
        margin: 0;
    }

    .checksum {
        font-size: 0.8em;
        font-family: monospace;
        padding: 1px 2px;
        background: #101010;
        border: 1px solid transparent;
        border-radius: 4px;
        cursor: pointer;
    }
</style>

<script lang="ts">
    import {DownloadInfo, loadDownloadInfo} from "./api";
    import {onMount} from "svelte";
    import {FileDecrypter} from "./utils/crypto";
    import {ProgressTracker} from "./utils/progress";
    import {streamDownloadDecryptToDisk} from "./utils/stream";
    import prettyBytes from "pretty-bytes";
    import {createDownloadWritableStream} from "./utils/file";
    import {DownloadState} from "./constants";

    let error = $state()
    let downloadInfo = $state<DownloadInfo>()
    let downloading = $state(DownloadState.Idle)
    let downloadProgress = $state('')

    onMount(async () => {
        try {
            downloadInfo = await loadDownloadInfo()
        } catch (e) {
            error = e
        }
    })

    async function download() {
        const info = downloadInfo
        if (!info) return

        downloading = DownloadState.Downloading
        const fileDecrypter = new FileDecrypter(info.key, info.iv)
        const progressTracker = new ProgressTracker(info.size, (progress, total) => {
            downloadProgress = ` (${prettyBytes(progress)} / ${prettyBytes(total)})`
        })
        try {
            const downloadOutputStream = await createDownloadWritableStream(info.name, info.size)
            await streamDownloadDecryptToDisk(info.url, fileDecrypter, downloadOutputStream, progressTracker)
            downloading = DownloadState.Completed
        } catch (e) {
            DownloadState.Failure
        }
    }

    function copyChecksum() {
        const checksum = downloadInfo?.checksum
        if (!checksum) return
        navigator.clipboard.writeText(checksum)
    }
</script>
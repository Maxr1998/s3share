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
            <h3 class="error">Download failed</h3>
            <button type="button" onclick="{() => downloading = DownloadState.Idle}">Retry</button>
        {/if}
        {#if (downloading === DownloadState.Idle || downloading === DownloadState.Completed) && downloadInfo.checksums.size > 0}
            <div class="checksum-box">
                <h5>Checksums (click to copy)</h5>
                <div class="checksum-container">
                    {#each downloadInfo.checksums as [alg, checksum]}
                        <div class="checksum-col">
                            <span class="alg">{alg}</span>
                        </div>
                        <div class="checksum-col">
                            <span class="checksum"
                                  onclick="{() => copyToClipboard(checksum)}"
                                  onkeydown="{(e) => {e.key === 'Enter' && copyToClipboard(checksum)}}"
                                  role="button"
                                  tabindex="0">{checksum}</span>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    {:else}
        <p>Loading file information...</p>
    {/if}
</div>

<style>
    p {
        margin: 6px 0 0 0;
    }

    .checksum-box {
        margin: 1.5em 0 0 0;
    }

    .checksum-box h5 {
        margin: 0 0 8px;
    }

    .checksum-container {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-column-gap: 4px;
        grid-row-gap: 4px;
        font-size: 0.6rem;
        font-family: monospace;
    }

    .checksum-col {
        text-align: left;
    }

    .alg, .checksum {
        padding: 1px 0.3rem;
        background: var(--button-color);
        border: 1px solid transparent;
        border-radius: 4px;
    }

    .alg {
        background: var(--chip-color);
        color: #faa;
    }

    .checksum {
        cursor: pointer;
    }
</style>

<script lang="ts">
    import {DownloadInfo, loadDownloadInfo} from "../api"
    import {onMount} from "svelte"
    import {ProgressTracker} from "../utils/progress"
    import {streamDownloadDecryptToDisk} from "../utils/stream"
    import prettyBytes from "pretty-bytes"
    import {createDownloadWritableStream} from "../utils/file"
    import {DownloadState} from "../constants"
    import {FileDecryptor} from "../crypto/decryptor"

    let error = $state()
    let downloadInfo = $state<DownloadInfo>()
    let downloading = $state(DownloadState.Idle)
    let downloadProgress = $state('')

    onMount(async () => {
        try {
            downloadInfo = await loadDownloadInfo()
        } catch (e) {
            console.error(e)
            error = e
        }
    })

    async function download() {
        const info = downloadInfo
        if (!info) return

        downloading = DownloadState.Downloading
        const fileDecrypter = new FileDecryptor(info.key, info.iv)
        const progressTracker = new ProgressTracker(info.size, (progress, total) => {
            downloadProgress = ` (${prettyBytes(progress)} / ${prettyBytes(total)})`
        })
        try {
            const downloadOutputStream = await createDownloadWritableStream(info.name, info.size)
            await streamDownloadDecryptToDisk(info.url, fileDecrypter, downloadOutputStream, progressTracker)
            downloading = DownloadState.Completed
        } catch (e) {
            console.error(e)
            downloading = DownloadState.Failure
        }
    }

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text)
    }
</script>
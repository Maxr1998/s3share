<div>
    {#if error}
        <p class="error">{error}</p>
    {:else if downloadInfo}
        {#if downloading !== DownloadState.Failure}
            <p class="filename">{downloadInfo.name}</p>
            <p class="meta">
                {prettyBytes(downloadInfo.size)}
                {#if downloadInfo.lastModified} • {formatDate(downloadInfo.lastModified)}{/if}
            </p>
        {/if}

        {#if downloading === DownloadState.Idle}
            <button type="button" onclick="{download}">Download</button>
        {:else if downloading === DownloadState.Downloading}
            <p class="download-status">Downloading...{downloadProgress}</p>
        {:else if downloading === DownloadState.Completed}
            <p class="download-status">Successfully downloaded {downloadInfo.name}.</p>
        {:else if downloading === DownloadState.Failure}
            <p class="error">Download failed</p>
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
    .filename {
        font-size: 1.25rem;
        font-weight: 600;
    }

    .meta {
        margin-top: 0.5rem;
        font-size: 0.9rem;
        opacity: 0.55;
    }

    button {
        margin-top: 2rem;
    }

    .checksum-box {
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .checksum-box h5 {
        margin: 0 0 8px;
        font-size: 0.9rem;
        opacity: 0.55;
        font-weight: 400;
    }

    .checksum-container {
        display: inline-grid;
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
        display: block;
        text-align: center;
        background: var(--chip-color);
        color: #faa;
    }

    .checksum {
        display: inline-block;
        cursor: pointer;
    }

    .download-status {
        margin-top: 2rem;
    }

    .error {
        font-size: 1.25rem;
        font-weight: 600;
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

    const THRESHOLDS: [Intl.RelativeTimeFormatUnit, number][] = [
        ['second', 60],
        ['minute', 60],
        ['hour', 24],
        ['day', 7],
        ['week', 4.35],
        ['month', 12],
    ]
    const formatter = new Intl.RelativeTimeFormat('default', {numeric: 'auto'})

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

    function formatDate(date: Date): string {
        let diff = (date.getTime() - Date.now()) / 1000
        for (const [unit, threshold] of THRESHOLDS) {
            if (Math.abs(diff) < threshold) {
                return formatter.format(Math.round(diff), unit)
            }
            diff /= threshold
        }
        return formatter.format(Math.round(diff), 'year')
    }

    async function download() {
        const info = downloadInfo
        if (!info) return

        try {
            const downloadOutputStream = await createDownloadWritableStream(info.name, info.size)
            const fileDecrypter = new FileDecryptor(info.key, info.iv)
            const progressTracker = new ProgressTracker(info.size, (progress, total) => {
                downloadProgress = ` (${prettyBytes(progress)} / ${prettyBytes(total)})`
            })
            downloading = DownloadState.Downloading
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
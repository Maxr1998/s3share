<div class="track">
    <div class="fill" style="width: {progress}%"></div>
</div>
<p class="status">
    <span>{prettyBytes(bytes, {fixedWidth: 8})} / {prettyBytes(total)}</span>
    {#if speed > 0}<span> · {prettyBytes(speed, {fixedWidth: 8})}/s</span>{/if}
</p>

<style>
    .track {
        width: 100%;
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        overflow: hidden;
    }

    .fill {
        height: 100%;
        background: var(--link-color);
        border-radius: 4px;
        transition: width 0.25s linear;
    }

    .status {
        margin-top: 0.5rem;
        font-size: 0.9rem;
        opacity: 0.55;
    }

    .status span {
        white-space: pre-wrap;
    }
</style>

<script lang="ts">
    import prettyBytes from "pretty-bytes"

    type Props = {
        bytes: number,
        total: number,
        speed?: number,
    }

    let {bytes, total, speed = 0}: Props = $props()

    const progress = $derived(total > 0 ? bytes / total * 100 : 0)
</script>
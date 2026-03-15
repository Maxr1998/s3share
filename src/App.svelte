<div>
    <h1>S3share</h1>
    {#if currentRoute === "download"}
        <Download/>
    {:else if currentRoute === "upload"}
        <Upload/>
    {/if}
</div>

<script lang="ts">
    import {parseRoute} from "./router"
    import Download from "./routes/Download.svelte"
    import Upload from "./routes/Upload.svelte"

    const currentRoute = parseRoute(window.location.pathname)
</script>
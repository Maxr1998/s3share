<div>
    <h1>S3share</h1>
    {#if currentRoute === "download"}
        <Download/>
    {/if}
</div>

<script lang="ts">
    import {parseRoute} from "./router"
    import Download from "./routes/Download.svelte"

    const currentRoute = parseRoute(window.location.pathname)
</script>
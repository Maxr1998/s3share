<div>
    {#if error}
        <p class="error">{error}</p>
    {/if}
    <button type="button" onclick="{createUpload}" disabled={pending}>Create upload</button>
</div>

<script lang="ts">
    import type {AdminCreateUploadResponse} from "../../worker/api/upload"
    import {post} from "../request"

    let pending = $state(false)
    let error = $state()

    async function createUpload() {
        pending = true
        error = null
        try {
            const response = await post("/api/admin/create-upload", {})
            if (!response.ok) {
                error = `Failed: ${response.status}`
                return
            }

            const createUploadResponse: AdminCreateUploadResponse = await response.json()

            window.location.href = `/upload/${createUploadResponse.upload_token}`
        } catch (e) {
            // Session may have expired, reload page
            window.location.reload()
        } finally {
            pending = false
        }
    }
</script>
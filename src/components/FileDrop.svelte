{#if isDragging}
    <div class="drop-overlay">Drop to upload</div>
{/if}

<style>
    .drop-overlay {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        font-weight: 600;
        background-color: rgba(0, 0, 0, 0.6);
        border: 3px dashed var(--link-color);
        z-index: 100;
        pointer-events: none;
    }
</style>

<script lang="ts">
    import {onMount} from "svelte"

    type Props = {
        enabled: boolean,
        onDrop: (file: File) => void,
    }

    let {enabled, onDrop}: Props = $props()

    let isDragging = $state(false)
    let dragCounter = 0

    onMount(() => {
        function onDragEnter(e: DragEvent) {
            if (!enabled || !e.dataTransfer?.types.includes("Files")) return
            dragCounter++
            isDragging = true
        }

        function onDragOver(e: DragEvent) {
            if (!enabled) return
            e.preventDefault()
        }

        function onDragLeave() {
            if (--dragCounter === 0) isDragging = false
        }

        function handleDrop(e: DragEvent) {
            e.preventDefault()
            dragCounter = 0
            isDragging = false
            if (!enabled) return
            const file = e.dataTransfer?.files[0]
            if (file) onDrop(file)
        }

        document.addEventListener("dragenter", onDragEnter)
        document.addEventListener("dragover", onDragOver)
        document.addEventListener("dragleave", onDragLeave)
        document.addEventListener("drop", handleDrop)

        return () => {
            document.removeEventListener("dragenter", onDragEnter)
            document.removeEventListener("dragover", onDragOver)
            document.removeEventListener("dragleave", onDragLeave)
            document.removeEventListener("drop", handleDrop)
        }
    })
</script>
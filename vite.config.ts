import {defineConfig} from 'vite';
import {svelte} from '@sveltejs/vite-plugin-svelte';

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        svelte({
            /* plugin options */
        })
    ],
    server: {
        proxy: {
            '/download': {
                target: "https://s3share.pages.dev",
                changeOrigin: true,
            }
        }
    }
});
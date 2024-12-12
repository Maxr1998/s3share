import "./style.css"
import {mount} from "svelte"
import App from "./App.svelte"

const app = mount(App, {
        target: document.getElementById("app")!,
    })


;(async () => {
    if ("serviceWorker" in navigator) {
        await navigator.serviceWorker.register("/sw.js")
    }
})()

export default app
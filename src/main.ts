import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'vue-plugin-hiprint/dist/print-lock.css'

const app = createApp(App)

app.use(router)

app.mount('#app')

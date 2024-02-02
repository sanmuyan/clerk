import { createApp } from 'vue'
import App from './App.vue'
import installElementPlus from './plugins/element'
import installHljs from './plugins/hljs'
import '@/styles/index.scss'

const app = createApp(App)

installElementPlus(app)
installHljs(app)

app.mount('#app')

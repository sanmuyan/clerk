import { createApp } from 'vue'
import App from './App.vue'
import '@/styles/index.scss'
import installElementPlus from './plugins/element'
import installHljs from './plugins/hljs'

const app = createApp(App)

installElementPlus(app)
installHljs(app)

app.mount('#app')

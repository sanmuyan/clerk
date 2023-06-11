import { createApp } from 'vue'
import App from './App.vue'
import installElementPlus from './plugins/element'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-light.css'
import '@/styles/index.scss'

const app = createApp(App)

installElementPlus(app)
app.directive('highlight', function (el) {
  const blocks = el.querySelectorAll('pre code')
  blocks.forEach((block) => {
    hljs.highlightBlock(block)
  })
})

app.mount('#app')

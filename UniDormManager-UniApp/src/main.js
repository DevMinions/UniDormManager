import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// 导入全局样式
import './styles/global.scss'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()
  
  app.use(pinia)
  
  return {
    app,
    pinia,
  }
}

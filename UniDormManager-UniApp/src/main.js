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
// CI Trigger
// Trigger CI Wed Mar 18 01:24:15 PM UTC 2026
// Trigger 1773840334
// Trigger CI Wed Mar 18 01:27:51 PM UTC 2026

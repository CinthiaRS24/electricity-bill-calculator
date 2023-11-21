// import './assets/main.css'

import { createApp } from 'vue'
// import { createPinia } from 'pinia'

import Form from './Form.vue'
// import router from './router'

const app = createApp(Form)

// app.use(createPinia())
// app.use(router)

app.mount('#app')

// import './assets/main.css'

import { createApp } from 'vue';
// import { createPinia } from 'pinia'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Vuetify
const vuetify = createVuetify({
    components,
    directives,
    theme: {
      defaultTheme: 'dark'
    },
    icons: {
      iconfont: 'mdiSvg' as Iconfont, // Usa MDI como conjunto de iconos
    },
  })

import ElectricityCalculator from './ElectricityCalculator.vue'
// import router from './router'

const app = createApp(ElectricityCalculator)
app.use(vuetify)

// app.use(createPinia())
// app.use(router)

app.mount('#app')

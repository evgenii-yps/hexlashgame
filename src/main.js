import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import i18n from './plugins/i18n'

import './styles/global.css'

const app = createApp(App)

app.use(router)
app.use(store)
app.use(vuetify)
app.use(i18n)

app.mount('#app')

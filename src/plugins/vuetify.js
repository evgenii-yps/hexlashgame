import 'vuetify/styles'
import { createVuetify } from 'vuetify'

const darkTheme = {
  dark: true,
  colors: {
    background: '#000000',
    surface: '#111111',
    primary: '#FF066F',
    secondary: '#cc33ff',
    accent: '#FF066F',
    error: '#FF5252',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FFC107',
  },
}

export default createVuetify({
  theme: {
    defaultTheme: 'darkTheme',
    themes: {
      darkTheme,
    },
  },
})

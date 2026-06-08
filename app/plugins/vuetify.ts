import { createVuetify, type ThemeDefinition } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const light: ThemeDefinition = {
    dark: false,
    variables: {
        'border-color': '#f0f0f0',
        'card-shadow': '0px 1px 4px rgba(0, 0, 0, 0.08)',
    },
    colors: {
        primary: '#1677ff',
        secondary: '#8c8c8c',
        info: '#13c2c2',
        success: '#52c41a',
        warning: '#faad14',
        error: '#ff4d4f',
        // Custom Mantis colors
        lightprimary: '#e6f4ff',
        lightsecondary: '#f5f5f5',
        darkText: '#212121',
        lightText: '#8c8c8c',
        darkprimary: '#0958d9',
        darksecondary: '#7a7878',
        borderLight: '#e6ebf1',
        containerBg: '#fafafb',
        surface: '#fff',
    }
}

export default defineNuxtPlugin((app) => {
    const vuetify = createVuetify({
        components,
        directives,
        theme: {
            defaultTheme: 'light',
            themes: { light }
        }
    })
    app.vueApp.use(vuetify)
})
import { defineStore } from 'pinia';
import config from '~/utils/config';

export const useCustomizerStore = defineStore('customizer', () => {
    const sidebarDrawerCookie = useCookie<boolean>('sidebar_drawer', { default: () => true, sameSite: 'lax' })
    const miniSidebarCookie = useCookie<boolean>('mini_sidebar', { default: () => false, sameSite: 'lax' })

    const savedTheme = import.meta.client ? localStorage.getItem('customizer:theme') : null
    const savedFont = import.meta.client ? localStorage.getItem('customizer:font') : null

    const Sidebar_drawer = ref(sidebarDrawerCookie.value)
    const mini_sidebar = ref(miniSidebarCookie.value)
    const actTheme = ref(savedTheme || config.actTheme)
    const fontTheme = ref(savedFont || config.fontTheme)

    watch(Sidebar_drawer, (val) => { sidebarDrawerCookie.value = val })
    watch(mini_sidebar, (val) => { miniSidebarCookie.value = val })

    watch(actTheme, (val) => {
        if (import.meta.client) localStorage.setItem('customizer:theme', val)
    })
    watch(fontTheme, (val) => {
        if (import.meta.client) localStorage.setItem('customizer:font', val)
    })

    function SET_SIDEBAR_DRAWER() {
        Sidebar_drawer.value = !Sidebar_drawer.value
    }

    function SET_MINI_SIDEBAR(payload: boolean) {
        mini_sidebar.value = payload
    }

    function SET_THEME(payload: string) {
        actTheme.value = payload
    }

    function SET_FONT(payload: string) {
        fontTheme.value = payload
    }

    return {
        Sidebar_drawer,
        mini_sidebar,
        actTheme,
        fontTheme,
        SET_SIDEBAR_DRAWER,
        SET_MINI_SIDEBAR,
        SET_THEME,
        SET_FONT,
    }
})

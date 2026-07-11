export default defineNuxtPlugin(() => {
    const customizer = useCustomizerStore()
    try {
        const raw = localStorage.getItem('customizer')
        if (!raw) return
        const saved = JSON.parse(raw)
        if (typeof saved.Sidebar_drawer === 'boolean') customizer.Sidebar_drawer = saved.Sidebar_drawer
        if (typeof saved.mini_sidebar === 'boolean') customizer.mini_sidebar = saved.mini_sidebar
        if (typeof saved.actTheme === 'string') customizer.actTheme = saved.actTheme
        if (typeof saved.fontTheme === 'string') customizer.fontTheme = saved.fontTheme
    } catch {}
})

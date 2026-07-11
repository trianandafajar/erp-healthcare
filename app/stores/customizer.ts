import { defineStore } from 'pinia';
import config from '~/utils/config';

type CustomizerState = {
    Sidebar_drawer: boolean;
    mini_sidebar: boolean;
    actTheme: string;
    fontTheme: string;
};

function persistState(state: CustomizerState) {
    if (!import.meta.client) return
    localStorage.setItem('customizer', JSON.stringify(state))
}

export const useCustomizerStore = defineStore('customizer', {
    state: (): CustomizerState => ({
        Sidebar_drawer: config.Sidebar_drawer,
        mini_sidebar: config.mini_sidebar,
        actTheme: config.actTheme,
        fontTheme: config.fontTheme
    }),

    getters: {},
    actions: {
        SET_SIDEBAR_DRAWER(this: CustomizerState) {
            this.Sidebar_drawer = !this.Sidebar_drawer;
            persistState(this.$state)
        },
        SET_MINI_SIDEBAR(this: CustomizerState, payload: boolean) {
            this.mini_sidebar = payload;
            persistState(this.$state)
        },
        SET_THEME(this: CustomizerState, payload: string) {
            this.actTheme = payload;
            persistState(this.$state)
        },
        SET_FONT(this: CustomizerState, payload: string) {
            this.fontTheme = payload;
            persistState(this.$state)
        }
    }
});

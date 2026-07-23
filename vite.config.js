import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                admin: resolve(__dirname, 'admin.html'),
                survey: resolve(__dirname, 'survey.html'),
                dashboard: resolve(__dirname, 'dashboard.html'),
                servicios: resolve(__dirname, 'servicios.html'),
                login: resolve(__dirname, 'login.html'),
                recursos: resolve(__dirname, 'recursos.html'),
                surveysEditor: resolve(__dirname, 'surveys-editor.html'),
                privacy: resolve(__dirname, 'privacy.html'),
                legal: resolve(__dirname, 'legal.html'),
                cookies: resolve(__dirname, 'cookies.html'),
                terminos: resolve(__dirname, 'terminos.html'),
            },
        },
    },
});

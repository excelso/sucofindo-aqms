import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

export default defineConfig({
    plugins: [
        laravel({
            postcss: [tailwindcss(), autoprefixer()],
            input: [
                'resources/css/app.scss',
                'resources/js/app.tsx',
                'resources/css/ex-autocomplete.scss',
                'resources/css/experiment-expicker.scss',
                'resources/css/experiment-exbox.scss',
                'resources/css/sweetalert-custom.css',
                'resources/css/tagify-custom.css',
                'resources/css/experiment-exmenu.scss',
                'resources/js/login/index.tsx',
                'resources/js/login/index.tsx',
                'resources/js/main/dashboard/index.tsx'
            ],
            refresh: true,
        }),
    ],
    build: {
        chunkSizeWarningLimit: 1600,
    },
    server: {
        host: '0.0.0.0',
        port: 5175,
        hmr: {
            protocol: 'ws',
            host: 'localhost',
        },
    },
    resolve: {
        alias: {
            '@': '/resources',
        },
    },
});

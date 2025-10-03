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
                'resources/js/login/verify-otp.tsx',
                'resources/js/main/dashboard/index.tsx',
                'resources/js/main/settings/change-password/index.tsx',
                'resources/js/main/master/data-platform-loggers/index.tsx',
                'resources/js/main/master/data-platform-loggers/index-calibration.tsx',
                'resources/js/main/reports/index.tsx',
                'resources/js/main/master/data-sites/index.tsx',
                'resources/js/main/master/data-sites-location/index.tsx',
                'resources/js/main/master/data-users/index.tsx',

                'resources/js/main/be-sparing/dashboard/hasil-pengukuran/index.tsx',
                'resources/js/main/be-sparing/dashboard/maps/index.tsx',
                'resources/js/main/be-sparing/dashboard/maps/summary/index.tsx',
                'resources/js/main/be-sparing/master/data-customer/index.tsx',
                'resources/js/main/be-sparing/master/data-customer-lokasi/index.tsx',
                'resources/js/main/be-sparing/master/data-site/index.tsx',
                'resources/js/main/be-sparing/master/data-logger/index.tsx',
                'resources/js/main/be-sparing/reports/water-quality/index.tsx',
                'resources/js/main/be-sparing/reports/logs-parameter/index.tsx',
                'resources/js/main/be-sparing/reports/weekly-report/index.tsx',
            ],
            refresh: true,
        }),
    ],
    build: {
        chunkSizeWarningLimit: 1600,
    },
    server: {
        host: '127.0.0.1',
        port: 5175,
        hmr: {
            protocol: 'ws',
            host: '127.0.0.1',
        },
    },
    resolve: {
        alias: {
            '@': '/resources',
        },
    },
});

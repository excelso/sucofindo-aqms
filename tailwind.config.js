import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';
import screen from './screen.json'
import daisyui from "daisyui"
import flowbite from "flowbite/plugin"

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './node_modules/flowbite/**/*.js'
    ],
    theme: {
        screens: { ...screen },
        fontFamily: {
            nunito: ['Nunito', ...defaultTheme.fontFamily.sans],
            materialIcon: ['Material Icons'],
        },
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                "primary": '#298ea4',
                "secondary": '#2fadc9',
                "accent": '#5f73d5',
                "primary-dark": '#1c6371',
                "grey-1": '#cecece',
                "grey-2": '#dcdcdc',
                "grey-3": '#f5f5f5',
                "dark-4": '#eaeaea',
                "dark-5": '#fdfdfd',
                "dark-6": '#f7f7f7',
                "dark-1": '#282942',
                "dark-2": '#151623',
                "purple-1": '#b1b5f1',
            },
        },
    },
    plugins: [
        forms,
        daisyui,
        flowbite
    ],
    daisyui: {
        styled: true,
        themes: false,
        base: true,
        utils: true,
        logs: true,
        rtl: false,
        prefix: "ds-",
        darkTheme: "light",
    },
};

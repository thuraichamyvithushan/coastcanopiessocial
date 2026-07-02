/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#fff9e7',
                    100: '#fff0bf',
                    200: '#ffe08a',
                    300: '#ffd45b',
                    400: '#fcc934',
                    500: '#f9bf1e',
                    600: '#f9bf1e', // Brand Gold
                    700: '#d8a200',
                    800: '#a87d00',
                    900: '#725500',
                },
                dark: {
                    DEFAULT: '#000000',
                    800: '#1a1a1a',
                    900: '#0f0f0f',
                    950: '#0a0a0a',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}

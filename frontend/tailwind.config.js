/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#0a0a0b',
                card: '#151518',
                border: '#27272a',
                'text-dim': '#a1a1aa',
            }
        },
    },
    plugins: [],
}

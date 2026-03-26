/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#050505',
                card: '#0d0d0f',
                border: '#1f2028',
                'text-dim': '#8892a4',
                // Metallic silver accents
                silver: {
                    100: '#e8ecf2',
                    200: '#c7ccdb',
                    300: '#9ba3b5',
                    400: '#6b7280',
                    500: '#4b5263',
                },
                // Premium dark surfaces
                surface: {
                    100: '#0d0d0f',
                    200: '#111115',
                    300: '#161620',
                    400: '#1c1c28',
                },
            },
            boxShadow: {
                'glass': 'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.5)',
                'glass-sm': 'inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.35)',
                'glow-sm': '0 0 12px rgba(99,102,241,0.2)',
            },
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: ['class', '[data-theme="dark"]'],
    theme: {
        extend: {
            colors: {
                // M3 Semantic Roles
                surface: 'rgb(var(--surface) / <alpha-value>)',
                'surface-container': 'rgb(var(--surface-container) / <alpha-value>)',
                'surface-container-high': 'rgb(var(--surface-container-high) / <alpha-value>)',
                primary: 'rgb(var(--primary) / <alpha-value>)',
                'on-primary': 'rgb(var(--on-primary) / <alpha-value>)',
                'primary-container': 'rgb(var(--primary-container) / <alpha-value>)',
                'on-primary-container': 'rgb(var(--on-primary-container) / <alpha-value>)',
                outline: 'rgb(var(--outline) / <alpha-value>)',

                // Legacy support (mapped to new roles where possible)
                main: 'rgb(var(--surface) / <alpha-value>)',
                card: 'rgb(var(--surface-container) / <alpha-value>)',
                border: 'rgb(var(--outline) / <alpha-value>)',
            },
            textColor: {
                main: 'rgb(var(--on-surface) / <alpha-value>)',
                secondary: 'rgb(var(--on-surface-variant) / <alpha-value>)',
            }
        },
    },
    plugins: [],
}

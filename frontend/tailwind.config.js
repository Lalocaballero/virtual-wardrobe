/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        'midnight-ink': '#1A1A2E',
        'inkwell': '#4A4A6A',
        'slate': '#7E7E9A',
        'fog': '#D1D1DB',
        'cloud-white': '#F7F7F7',
        'sunrise-coral': '#FF6B6B',
        'electric-indigo': '#6F00FF',
        'cyber-yellow': '#FFD300',
        'danger': '#E54848',
        'warning': '#F5A623',
        'dark-subtle': '#2A2A4A',
        'dark-text-secondary': '#A0A0B8',

        // Semantic mapping
        background: '#F7F7F7', // cloud-white
        foreground: '#1A1A2E', // midnight-ink
        
        primary: {
          DEFAULT: '#FF6B6B', // sunrise-coral
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#6F00FF', // electric-indigo
          foreground: '#FFFFFF',
        },
        destructive: {
          DEFAULT: '#E54848', // danger
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#D1D1DB', // fog
          foreground: '#7E7E9A', // slate
        },
        accent: {
          DEFAULT: '#FFD300', // cyber-yellow
          foreground: '#1A1A2E', // midnight-ink
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#1A1A2E',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#1A1A2E',
        },
        border: '#D1D1DB', // fog
        input: '#D1D1DB', // fog
        ring: '#6F00FF', // electric-indigo
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fadeIn": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fadeIn": "fadeIn 0.3s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
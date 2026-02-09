/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./App.tsx"
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          yellow: '#facc15',
          red: '#f87171',
          blue: '#00F0FF',
          cyan: '#22d3ee',
          green: '#4ade80',
          purple: '#BD0AFF',
        },
        dark: {
          bg: '#050505',
          panel: '#1A1A1A',
        }
      },
      fontFamily: {
        cyber: ['"Orbitron"', 'sans-serif'],
        tech: ['"Share Tech Mono"', 'monospace'],
      },
      boxShadow: {
        'neon-blue': '0 0 5px #00F0FF, 0 0 10px #00F0FF',
        'neon-purple': '0 0 5px #BD0AFF, 0 0 10px #BD0AFF',
        'neon-red': '0 0 5px #f87171, 0 0 10px #f87171',
      }
    },
  },
  plugins: [],
}

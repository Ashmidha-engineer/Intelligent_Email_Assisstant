/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // User-Requested Custom Palette
        palette: {
          cream: '#F7F5EB',   // Canvas & base background
          sand: '#EAE0DA',    // Warm linen / soft card surface & subtle borders
          sky: '#D5E3E8',     // Pastel sky blue / active pills / soft tint
          mist: '#A0C3D2',    // Muted ocean mist / borders / interactive accents
          blush: '#EAC7C7',   // Soft rose blush / tone badges / warm highlights
          coral: '#E8A2A2',   // Rose coral / primary CTA / action & focus accent
        },
        charcoal: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'soft-sm': '0 2px 8px -2px rgba(160, 195, 210, 0.25), 0 1px 4px -1px rgba(232, 162, 162, 0.15)',
        'soft-md': '0 6px 20px -4px rgba(160, 195, 210, 0.35), 0 3px 10px -2px rgba(232, 162, 162, 0.2)',
        'soft-lg': '0 15px 35px -8px rgba(160, 195, 210, 0.4), 0 6px 16px -4px rgba(232, 162, 162, 0.25)',
        'coral-glow': '0 0 20px rgba(232, 162, 162, 0.45)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'coral-pulse': 'coralPulse 2.5s infinite',
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
      },
      keyframes: {
        coralPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(232, 162, 162, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(232, 162, 162, 0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

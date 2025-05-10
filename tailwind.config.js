/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: '#3B82F6', // blue-500
          secondary: '#10B981', // emerald-500
          accent: '#6366F1', // indigo-500
        },
      },
    },
    plugins: [],
  }
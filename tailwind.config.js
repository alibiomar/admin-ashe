module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',   // Tailwind will scan all pages
    './components/**/*.{js,ts,jsx,tsx}',   // Tailwind will scan all components
    './layouts/**/*.{js,ts,jsx,tsx}',    // If you have a layouts folder, include it
    './src/**/*.{js,ts,jsx,tsx}',        // If your components or pages are inside a src folder
    './app/**/*.{js,ts,jsx,tsx}',        // If you have an "app" folder or any other subfolder
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
      },
      colors: {
        primary: '#1a202c',
        secondary: '#2d3748',
        accent: '#4a5568',
        light: '#f9f9f9',
        dark: '#1a202c',
        highlight: '#46c7c7',
      },
     }
   },
   plugins: []
 };
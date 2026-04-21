import { defineConfig, presetAttributify, presetIcons, presetUno } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons(),
  ],
  theme: {
    colors: {
      brand: {
        50: '#f5f8ff',
        100: '#e9f0ff',
        200: '#c9dcff',
        300: '#9fbfff',
        400: '#709bff',
        500: '#4474fa',
        600: '#2c59e0',
        700: '#2446bd',
        800: '#233d99',
        900: '#23387a',
      },
    },
  },
})

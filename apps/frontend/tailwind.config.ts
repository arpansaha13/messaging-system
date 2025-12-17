import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: ['src/**/*.{ts,vue,css}'],
  theme: {
    extend: {
      screens: {
        '3xl': '1920px', // extra large screens
      },
      // Re-enable the default aspect-ratio utilities
      // https://ui.nuxt.com/getting-started/installation#nuxtjstailwindcss
      aspectRatio: {
        auto: 'auto',
        square: '1 / 1',
        video: '16 / 9',
      },
    },
  },
}

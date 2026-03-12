// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    // https://ui.nuxt.com/
    '@nuxt/ui',

    // https://reka-ui.com/
    'reka-ui/nuxt',

    // https://vueuse.org/
    '@vueuse/nuxt',

    // https://image.nuxt.com
    // '@nuxt/image',

    // https://eslint.nuxt.com/
    '@nuxt/eslint',

    // https://nuxt.com/docs/getting-started/testing
    '@nuxt/test-utils/module',
  ],

  srcDir: 'src/',

  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
      },
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },

  imports: {
    dirs: ['~/store', '~/utils/mutations', '~/composables/api'],
  },

  devServer: {
    port: 3000,
  },

  runtimeConfig: {
    authCookieName: '',
    apiBaseUrl: '',
    public: {
      environment: '',
      csrfCookieName: '',
    },
  },

  css: ['~/assets/css/main.css'],

  ui: {
    colorMode: false,
  },
})

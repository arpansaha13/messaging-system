export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', () => {
    document.body.dataset.hydrated = 'true'
  })
})

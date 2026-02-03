export default defineNuxtPlugin(() => {
  const { notification, hideNotification } = useNotification()
  const toast = useToast()

  watch(
    notification,
    n => {
      if (n.show) {
        toast.add({
          title: n.title,
          description: n.description,
          color: n.status === 'success' ? 'success' : 'error',
        })

        hideNotification()
      }
    },
    { deep: true },
  )
})

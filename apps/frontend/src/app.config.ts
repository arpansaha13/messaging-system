export default defineAppConfig({
  appName: 'Messaging System',
  ui: {
    colors: {
      primary: 'emerald',
      gray: 'gray',
    },
    card: {
      variants: {
        variant: {
          outline: {
            root: 'bg-gray-100',
            header: 'bg-white',
            footer: 'bg-white',
          },
        },
      },
    },
  },
})

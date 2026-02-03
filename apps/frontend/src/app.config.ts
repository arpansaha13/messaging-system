export default defineAppConfig({
  appName: 'Messaging System',
  ui: {
    colors: {
      primary: 'emerald',
      gray: 'gray',
    },
    card: {
      defaultVariants: {
        variant: 'subtle',
      },
      variants: {
        variant: {
          subtle: {
            root: 'bg-gray-100',
            header: 'bg-white',
            footer: 'bg-white',
          },
        },
      },
    },
  },
})

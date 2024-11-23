export function generateHash(length = 8) {
  let result = ''
  let counter = 0

  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length

  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
    counter++
  }

  return result
}

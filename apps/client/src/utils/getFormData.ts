export default function getFormData<T extends Record<string, any>>(formEl: HTMLFormElement | null) {
  if (formEl === null) {
    console.warn('"formEl" is null in getFormData().')
    return {} as T
  }

  const formData = new FormData(formEl)
  return Object.fromEntries(formData.entries()) as T
}

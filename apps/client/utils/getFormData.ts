export default function getFormData(formEl: HTMLFormElement) {
  if (formEl === null) {
    console.warn('"formEl" is null in getFormData().')
    return {}
  }

  const formData = new FormData(formEl)
  return Object.fromEntries(formData.entries())
}

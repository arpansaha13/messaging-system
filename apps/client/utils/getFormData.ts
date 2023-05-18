interface Options {
  format: 'formdata' | 'object' | 'json'
}

export default function getFormData(formEl: HTMLFormElement, options: Options) {
  if (formEl === null) {
    console.warn('"formEl" is null in getFormData().')
    return
  }

  const format = options?.format ?? 'formdata'

  const formData = new FormData(formEl)

  switch (format) {
    case 'formdata':
      return formData
    case 'object':
      return formDataToObject(formData)
    case 'json':
      const object = formDataToObject(formData)
      return JSON.stringify(object)
    default:
      throw new Error(`Invalid format: ${format} in getFormData() options.`)
  }
}

function formDataToObject(formData: FormData) {
  const object: any = {}
  formData.forEach((value, key) => (object[key] = value))
  return object
}

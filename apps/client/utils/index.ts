export function ISODateNow() {
  return new Date(Date.now()).toISOString()
}

export function ISOToMilliSecs(ISODate: string) {
  return new Date(ISODate).getTime()
}

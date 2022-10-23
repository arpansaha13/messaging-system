import { ContactEntity } from 'src/entities/contact.entity'

type UpperCaseAlphabets = `${string}`

export interface ContactModel {
  [key: UpperCaseAlphabets]: Pick<ContactEntity, 'alias' | 'contact_user'>[]
}

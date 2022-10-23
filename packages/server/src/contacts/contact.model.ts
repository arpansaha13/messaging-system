import { ContactEntity } from 'src/entities/contact.entity'

export interface ContactModel {
  [key: string]: Pick<ContactEntity, 'alias' | 'contact_user'>[]
}

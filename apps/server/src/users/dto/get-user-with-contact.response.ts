import type { Contact } from 'src/contacts/contact.entity'
import type { User } from '../user.entity'

export interface GetUserWithContactResponse {
  id: User['id']
  globalName: User['globalName']
  username: User['username']
  dp: User['dp']
  bio: User['bio']
  contact: {
    id: Contact['id']
    alias: Contact['alias']
  }
}

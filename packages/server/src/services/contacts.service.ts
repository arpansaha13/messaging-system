import { Injectable } from '@nestjs/common'
// Models
import type { ContactModel } from 'src/models/contact.model'

@Injectable()
export class ContactsService {
  getContacts(): ContactModel[] {
    // Fake data for now
    return [
      {
        userTag: 'first',
        name: 'Calvin Hawkins',
        dp: 'https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
      {
        userTag: 'second',
        name: 'Kristen Ramos',
        dp: 'https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
      {
        userTag: 'third',
        name: 'Ted Fox',
        dp: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
    ]
  }
}

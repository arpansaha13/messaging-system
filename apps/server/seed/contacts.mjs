import { faker } from '@faker-js/faker'

export async function insertContacts(client, users) {
  const contactEntries = []
  const maxContacts = 50
  let contactsInsertCount = 0

  for (const user of users) {
    const existingContacts = new Set([user.id])
    const numberOfContacts = faker.number.int({ min: 0, max: Math.min(maxContacts, users.length - 1) })

    for (let i = 0; i < numberOfContacts; i++) {
      const possibleContacts = users.filter(u => !existingContacts.has(u.id))
      const contactUser = faker.helpers.arrayElement(possibleContacts)
      existingContacts.add(contactUser.id)

      contactEntries.push({
        user_id: user.id,
        user_id_in_contact: contactUser.id,
        alias: faker.person.fullName(),
        created_at: faker.date.past(),
        updated_at: faker.date.past(),
      })

      // 20 at a time
      if (contactEntries.length === 20) {
        await bulkInsertContacts(contactEntries)
        contactsInsertCount += contactEntries.length
        contactEntries.length = 0 // Clear the array
      }
    }
  }

  // Insert remaining contact entries
  if (contactEntries.length > 0) {
    await bulkInsertContacts(contactEntries)
    contactsInsertCount += contactEntries.length
  }

  return contactsInsertCount

  async function bulkInsertContacts(entries) {
    const values = []
    const placeholders = entries
      .map((entry, index) => {
        const offset = index * 5
        values.push(entry.user_id, entry.user_id_in_contact, entry.alias, entry.created_at, entry.updated_at)
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`
      })
      .join(', ')

    const query = `
      INSERT INTO contacts
      (user_id, user_id_in_contact, alias, created_at, updated_at)
      VALUES ${placeholders}
    `

    await client.query(query, values)
  }
}

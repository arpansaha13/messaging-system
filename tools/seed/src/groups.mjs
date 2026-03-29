import { faker } from '@faker-js/faker'

const groups = []
const MAX_GROUPS = 10

export async function insertGroups(client, users) {
  const groupEntries = []
  let groupsInsertCount = 0

  for (let i = 0; i < MAX_GROUPS; i++) {
    const founder = faker.helpers.arrayElement(users)

    groupEntries.push({
      name: faker.company.name(),
      founder_id: founder.id,
    })

    // 20 at a time
    if (groupEntries.length === 20) {
      await bulkInsertGroups(groupEntries)
      groupsInsertCount += groupEntries.length
      groupEntries.length = 0 // Clear the array
    }
  }

  // Insert remaining group entries
  if (groupEntries.length > 0) {
    await bulkInsertGroups(groupEntries)
    groupsInsertCount += groupEntries.length
  }

  return {
    data: groups,
    count: groupsInsertCount,
  }

  async function bulkInsertGroups(entries) {
    const values = []
    const placeholders = entries
      .map((entry, index) => {
        const offset = index * 2
        values.push(entry.name, entry.founder_id)
        return `($${offset + 1}, $${offset + 2})`
      })
      .join(', ')

    const query = `
      INSERT INTO groups (name, founder_id)
      VALUES ${placeholders}
      RETURNING id
    `

    const result = await client.query(query, values)
    result.rows.forEach((row, i) => {
      entries[i].id = row.id
      groups.push(Object.freeze({
        id: row.id,
        founder_id: entries[i].founder_id,
        channels: [], // filled in insertChannels
        members: [] // filled in inserUserGroups
      }))
    })
  }
}

import { faker } from '@faker-js/faker'

const MAX_CHANNELS = 30

export async function insertChannels(client, groups) {
  const channelEntries = []
  let channelsInsertCount = 0

  // Ensure every group has at least one channel
  for (const group of groups) {
    channelEntries.push({
      name: faker.company.name(),
      group_id: group.id,
    })
  }

  // Add additional channels up to the MAX_CHANNELS limit
  for (let i = 0; i < MAX_CHANNELS - groups.length; i++) {
    const group = faker.helpers.arrayElement(groups)

    channelEntries.push({
      name: faker.company.name(),
      group_id: group.id,
    })

    // 20 at a time
    if (channelEntries.length === 20) {
      await bulkInsertChannels(channelEntries)
      channelsInsertCount += channelEntries.length
      channelEntries.length = 0 // Clear the array
    }
  }

  // Insert remaining channel entries
  if (channelEntries.length > 0) {
    await bulkInsertChannels(channelEntries)
    channelsInsertCount += channelEntries.length
  }

  return {
    count: channelsInsertCount,
  }

  async function bulkInsertChannels(entries) {
    const values = []
    const placeholders = entries
      .map((entry, index) => {
        const offset = index * 2
        values.push(entry.name, entry.group_id)
        return `($${offset + 1}, $${offset + 2})`
      })
      .join(', ')

    const query = `
      INSERT INTO channels (name, group_id)
      VALUES ${placeholders}
    `

    await client.query(query, values)
  }
}

import { faker } from '@faker-js/faker'

const MAX_CHANNELS_PER_GROUP = 10

export async function insertChannels(client, groups) {
  const channelEntries = []
  let channelsInsertCount = 0

  for (const group of groups) {
    const numOfChannels = faker.number.int({ min: 1, max: MAX_CHANNELS_PER_GROUP })

    for (let i = 0; i < numOfChannels; i++) {
      const channel = {
        name: faker.company.name(),
        group_id: group.id,
      }
      channelEntries.push(channel)

      // 20 at a time, or if it is the last iteration
      if (channelEntries.length === 20 || i === numOfChannels - 1) {
        const insertedChannels = await bulkInsertChannels(channelEntries)
        channelsInsertCount += channelEntries.length

        // Add inserted channel IDs to the group object
        insertedChannels.forEach(channel => {
          group.channels.push(channel.id)
        })

        channelEntries.length = 0 // Clear the array
      }
    }
  }

  return { count: channelsInsertCount }

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
      RETURNING id
    `

    const result = await client.query(query, values)
    return result.rows
  }
}

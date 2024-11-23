import { faker } from '@faker-js/faker'

const chats = []

export async function insertChats(client, users) {
  const chatEntries = []
  let chatsInsertCount = 0

  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      if (i === j) continue

      // 60% chance of this chat to exist
      if (faker.number.int({ min: 0, max: 10 }) < 4) continue

      const user1 = users[i]
      const user2 = users[j]

      // Two entries for each chat
      for (const [sender, receiver] of [
        [user1, user2],
        [user2, user1],
      ]) {
        chatEntries.push({
          sender_id: sender.id,
          receiver_id: receiver.id,
          cleared_at: faker.date.past(),
          muted: faker.datatype.boolean(),
          archived: faker.datatype.boolean(),
          pinned: faker.datatype.boolean(),
        })

        // 20 at a time
        if (chatEntries.length === 20) {
          await bulkInsertChats(chatEntries)
          chatsInsertCount += chatEntries.length
          chatEntries.length = 0 // Clear the array
        }
      }
    }
  }

  // Insert remaining chat entries
  if (chatEntries.length > 0) {
    await bulkInsertChats(chatEntries)
    chatsInsertCount += chatEntries.length
  }

  return {
    data: chats,
    count: chatsInsertCount,
  }

  async function bulkInsertChats(entries) {
    const values = []
    const placeholders = entries
      .map((entry, i) => {
        const offset = i * 6
        values.push(entry.sender_id, entry.receiver_id, entry.cleared_at, entry.muted, entry.archived, entry.pinned)
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`
      })
      .join(', ')

    const query = `
      INSERT INTO chats (sender_id, receiver_id, cleared_at, muted, archived, pinned)
      VALUES ${placeholders}
      RETURNING sender_id, receiver_id
    `

    const result = await client.query(query, values)
    result.rows.forEach(row => {
      chats.push({ sender_id: row.sender_id, receiver_id: row.receiver_id })
    })
  }
}

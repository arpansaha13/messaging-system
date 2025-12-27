import { faker } from '@faker-js/faker'

const MAX_MESSAGES_MULTIPLIER = 200

export async function insertGroupMessages(client, groups) {
  const messageEntries = []
  const messageRecipientEntries = []
  let messagesInsertCount = 0
  let recipientsInsertCount = 0

  // Seed messages for group messages
  for (const group of groups) {
    const messageCount = faker.number.int({ min: 0, max: group.channels.length * MAX_MESSAGES_MULTIPLIER })

    for (let i = 0; i < messageCount; i++) {
      const senderId = faker.helpers.arrayElement(group.members)
      const channelId = faker.helpers.arrayElement(group.channels)
      const createdAt = faker.date.past()
      const updatedAt = faker.date.between({ from: createdAt, to: new Date() })

      messageEntries.push({
        content: faker.lorem.sentence(),
        sender_id: senderId,
        channel_id: channelId,
        created_at: createdAt,
        updated_at: updatedAt,
      })

      // 20 at a time
      if (messageEntries.length === 20) {
        const insertedMessages = await bulkInsertMessages(messageEntries)
        messagesInsertCount += messageEntries.length

        // Add recipients for the inserted messages
        for (const message of insertedMessages) {
          for (const memberId of group.members) {
            if (memberId === message.sender_id) continue
            messageRecipientEntries.push({
              message_id: message.id,
              receiver_id: memberId,
              status: faker.helpers.arrayElement(['SENT', 'DELIVERED', 'READ']),
              created_at: message.created_at,
              updated_at: message.updated_at,
            })
          }
        }

        if (messageRecipientEntries.length > 0) await bulkInsertRecipients(messageRecipientEntries)
        recipientsInsertCount += messageRecipientEntries.length
        messageEntries.length = 0 // Clear the array
        messageRecipientEntries.length = 0 // Clear the array
      }
    }
  }

  // Insert remaining messages and recipients
  if (messageEntries.length > 0) {
    const insertedMessages = await bulkInsertMessages(messageEntries)
    messagesInsertCount += messageEntries.length

    for (const message of insertedMessages) {
      const group = groups.find(g => g.channels.includes(message.channel_id))
      for (const memberId of group.members) {
        if (memberId === message.sender_id) continue
        messageRecipientEntries.push({
          message_id: message.id,
          receiver_id: memberId,
          status: faker.helpers.arrayElement(['SENT', 'DELIVERED', 'READ']),
          created_at: message.created_at,
          updated_at: message.updated_at,
        })
      }
    }

    if (messageRecipientEntries.length > 0) await bulkInsertRecipients(messageRecipientEntries)
    recipientsInsertCount += messageRecipientEntries.length
  }

  return { groupMessagesInsertCount: messagesInsertCount, groupMessageRecipientsInsertCount: recipientsInsertCount }

  async function bulkInsertMessages(messages) {
    const values = []
    const placeholders = messages
      .map((message, index) => {
        const offset = index * 5
        values.push(message.content, message.sender_id, message.channel_id, message.created_at, message.updated_at)
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`
      })
      .join(', ')

    const query = `
      INSERT INTO messages (content, sender_id, channel_id, created_at, updated_at)
      VALUES ${placeholders}
      RETURNING id, sender_id, created_at, updated_at, channel_id
    `

    const result = await client.query(query, values)
    return result.rows
  }

  async function bulkInsertRecipients(recipients) {
    const values = []
    const placeholders = recipients
      .map((recipient, i) => {
        const offset = i * 5
        values.push(
          recipient.message_id,
          recipient.receiver_id,
          recipient.status,
          recipient.created_at,
          recipient.updated_at,
        )
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`
      })
      .join(', ')

    const query = `
      INSERT INTO message_recipients (message_id, receiver_id, status, created_at, updated_at)
      VALUES ${placeholders}
    `

    await client.query(query, values)
  }
}

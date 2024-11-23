import { faker } from '@faker-js/faker'

export async function insertMessages(client, chats) {
  const messageEntries = []
  const messageRecipientEntries = []
  let messagesInsertCount = 0
  let recipientsInsertCount = 0

  for (const chat of chats) {
    const messageCount = faker.number.int({ min: 0, max: 100 })

    for (let i = 0; i < messageCount; i++) {
      const sender_id = faker.helpers.arrayElement([chat.sender_id, chat.receiver_id])
      const receiver_id = sender_id === chat.sender_id ? chat.receiver_id : chat.sender_id
      const createdAt = faker.date.past()
      const updatedAt = faker.date.between({ from: createdAt, to: new Date() })

      const message = {
        content: faker.lorem.sentence(),
        sender_id: sender_id,
        created_at: createdAt,
        updated_at: updatedAt,
      }
      messageEntries.push(message)

      const recipient = {
        receiver_id: receiver_id,
        status: faker.helpers.arrayElement(['SENT', 'DELIVERED', 'READ']),
        created_at: createdAt,
        updated_at: updatedAt,
      }
      messageRecipientEntries.push(recipient)

      if (messageEntries.length === 20) {
        await bulkInsertMessagesAndRecipients(messageEntries, messageRecipientEntries)
        messagesInsertCount += messageEntries.length
        recipientsInsertCount += messageRecipientEntries.length
        messageEntries.length = 0 // Clear the array
        messageRecipientEntries.length = 0 // Clear the array
      }
    }
  }

  // Insert remaining messages and recipients
  if (messageEntries.length > 0) {
    await bulkInsertMessagesAndRecipients(messageEntries, messageRecipientEntries)
    messagesInsertCount += messageEntries.length
    recipientsInsertCount += messageRecipientEntries.length
  }

  return { messagesInsertCount, recipientsInsertCount }

  async function bulkInsertMessagesAndRecipients(messages, recipients) {
    const messageValues = []
    const messagePlaceholders = messages
      .map((message, index) => {
        const offset = index * 4
        messageValues.push(message.content, message.sender_id, message.created_at, message.updated_at)
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`
      })
      .join(', ')

    const messageQuery = `
      INSERT INTO messages (content, sender_id, created_at, updated_at)
      VALUES ${messagePlaceholders}
      RETURNING id
    `

    const messageResult = await client.query(messageQuery, messageValues)
    const messageIds = messageResult.rows.map(row => row.id)

    const recipientValues = []
    const recipientPlaceholders = recipients
      .map((recipient, i) => {
        const offset = i * 5
        recipientValues.push(
          messageIds[i],
          recipient.receiver_id,
          recipient.status,
          recipient.created_at,
          recipient.updated_at,
        )
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`
      })
      .join(', ')

    const recipientQuery = `
      INSERT INTO message_recipients (message_id, receiver_id, status, created_at, updated_at)
      VALUES ${recipientPlaceholders}
    `

    await client.query(recipientQuery, recipientValues)
  }
}

import { faker } from '@faker-js/faker'

export async function insertUserGroups(client, users, groups) {
  const userGroupEntries = []
  let userGroupsInsertCount = 0

  for (const group of groups) {
    // Ensure the founder of the group has a user-group entry
    const founder = users.find(user => user.id === group.founder_id)
    userGroupEntries.push({
      user_id: founder.id,
      group_id: group.id,
    })

    const numberOfMembers = faker.number.int({ min: 1, max: users.length })

    // Start count from 1 because founder is already added as a member
    for (let i = 1; i < numberOfMembers; i++) {
      let user = faker.helpers.arrayElement(users)

      // Pick another user if it is the founder
      while (user.id === founder.id) {
        user = faker.helpers.arrayElement(users)
      }

      userGroupEntries.push({
        user_id: user.id,
        group_id: group.id,
      })

      // 20 at a time
      if (userGroupEntries.length === 20) {
        await bulkInsertUserGroups(userGroupEntries)
        userGroupsInsertCount += userGroupEntries.length
        userGroupEntries.length = 0 // Clear the array
      }
    }
  }

  // Insert remaining user group entries
  if (userGroupEntries.length > 0) {
    await bulkInsertUserGroups(userGroupEntries)
    userGroupsInsertCount += userGroupEntries.length
  }

  return {
    count: userGroupsInsertCount,
  }

  async function bulkInsertUserGroups(entries) {
    const values = []
    const placeholders = entries
      .map((entry, index) => {
        const offset = index * 2
        values.push(entry.user_id, entry.group_id)
        return `($${offset + 1}, $${offset + 2})`
      })
      .join(', ')

    const query = `
      INSERT INTO user_group (user_id, group_id)
      VALUES ${placeholders}
    `

    await client.query(query, values)
  }
}

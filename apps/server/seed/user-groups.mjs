import { faker } from '@faker-js/faker'

const MAX_MEMBERS_IN_GROUP = 10

export async function insertUserGroups(client, users, groups) {
  const userGroupEntries = []
  const existingUserGroups = new Set()
  let userGroupsInsertCount = 0

  for (const group of groups) {
    // Ensure the founder of the group has a user-group entry
    const founder = users.find(user => user.id === group.founder_id)
    existingUserGroups.add(founder.id)
    userGroupEntries.push({
      user_id: founder.id,
      group_id: group.id,
    })
    group.members.push(founder.id)

    const numberOfMembers = faker.number.int({ min: 1, max: MAX_MEMBERS_IN_GROUP })

    // Reduce 1 because founder is already added as a member
    for (let i = 0; i < numberOfMembers - 1; i++) {
      let user = faker.helpers.arrayElement(users)

      while (existingUserGroups.has(user.id)) {
        user = faker.helpers.arrayElement(users)
      }

      existingUserGroups.add(user.id)
      userGroupEntries.push({
        user_id: user.id,
        group_id: group.id,
      })
      group.members.push(user.id)

      // 20 at a time
      if (userGroupEntries.length === 20) {
        await bulkInsertUserGroups(userGroupEntries)
        userGroupsInsertCount += userGroupEntries.length
        userGroupEntries.length = 0 // Clear the array
      }
    }

    existingUserGroups.clear()
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

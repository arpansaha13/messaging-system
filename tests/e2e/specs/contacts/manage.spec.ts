import { test, expect } from '../../fixtures/auth.fixture'
import { loadUserIds } from '../../helpers/api'
import { waitForHydration } from '../../helpers/hydration'

test.describe('Contacts — Manage', () => {
  let userIds: ReturnType<typeof loadUserIds>

  test.beforeAll(() => {
    userIds = loadUserIds()
  })

  test.beforeEach(async ({ alicePage }) => {
    // Ensure Bob is Alice's contact before each test
    await alicePage.request.post('/api/contacts', {
      data: { userIdToAdd: userIds.bob, alias: 'Bob' },
    })
  })

  test('M-01 edit contact alias updates display name', async ({ alicePage }) => {
    await alicePage.goto('/contacts')
    await waitForHydration(alicePage)

    // Hover to reveal edit icon — implementation may use hover or a menu
    const contactItem = alicePage.getByText('Bob').first()
    await contactItem.hover()

    // Click the edit icon/button in the contact row
    await alicePage.getByRole('button', { name: /edit/i }).first().click()

    // Clear and fill new alias
    await alicePage.getByTestId('edit-contact-alias').fill('Bobby')
    await alicePage.getByTestId('edit-contact-save').click()

    await expect(alicePage.getByText('Bobby')).toBeVisible({ timeout: 5_000 })
  })

  test('M-02 delete contact removes it from list', async ({ alicePage }) => {
    await alicePage.goto('/contacts')
    await waitForHydration(alicePage)

    const contactItem = alicePage.getByText('Bob').first()
    await contactItem.hover()
    await alicePage.getByRole('button', { name: /delete/i }).first().click()

    await alicePage.getByTestId('delete-contact-confirm').click()

    await expect(alicePage.getByRole('heading', { name: 'No contacts' })).toBeVisible({ timeout: 5_000 })
  })

  test('M-03 cancel delete keeps contact in list', async ({ alicePage }) => {
    await alicePage.goto('/contacts')
    await waitForHydration(alicePage)

    const contactItem = alicePage.getByText('Bob').first()
    await contactItem.hover()
    await alicePage.getByRole('button', { name: /delete/i }).first().click()

    await alicePage.getByTestId('delete-contact-cancel').click()

    await expect(contactItem).toBeVisible()
  })
})

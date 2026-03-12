import { test, expect } from '../../fixtures/auth.fixture'
import { loadUserIds } from '../../helpers/api'
import { waitForHydration } from '../../helpers/hydration'

test.describe('Search & Add Contacts', () => {
  let userIds: ReturnType<typeof loadUserIds>

  test.beforeAll(() => {
    userIds = loadUserIds()
  })

  test('SA-01 search by name returns matching user', async ({ alicePage }) => {
    await alicePage.goto('/search')
    await waitForHydration(alicePage)

    await alicePage.getByTestId('search-input').fill('Bob')
    // Wait for debounced request (1s) then results
    await alicePage.waitForResponse(res => res.url().includes('/api/users/search'), {
      timeout: 5_000,
    })

    await expect(
      alicePage.getByTestId('search-result-item').filter({ hasText: 'Bob' }).first(),
    ).toBeVisible()
  })

  test('SA-02 search for nonexistent user shows empty state', async ({ alicePage }) => {
    await alicePage.goto('/search')
    await waitForHydration(alicePage)

    await alicePage.getByTestId('search-input').fill('zzznonexistent')
    await alicePage.waitForResponse(res => res.url().includes('/api/users/search'), {
      timeout: 5_000,
    })

    await expect(alicePage.getByText('No users found')).toBeVisible()
  })

  test('SA-03 debounce — no search request fires before 1s', async ({ alicePage }) => {
    await alicePage.goto('/search')
    await waitForHydration(alicePage)

    let searchFired = false
    alicePage.on('request', req => {
      if (req.url().includes('/api/users/search')) searchFired = true
    })

    await alicePage.getByTestId('search-input').fill('Bob')
    await alicePage.waitForTimeout(900)

    expect(searchFired).toBe(false)
  })

  test('SA-04 add contact saves with alias and appears in /contacts', async ({ alicePage }) => {
    await alicePage.goto('/search')
    await waitForHydration(alicePage)

    await alicePage.getByTestId('search-input').fill('Bob')
    await alicePage.waitForResponse(res => res.url().includes('/api/users/search'), {
      timeout: 5_000,
    })

    const addBtn = alicePage
      .getByTestId('search-result-item')
      .filter({ hasText: 'Bob' })
      .getByTestId('add-contact-btn')
    await addBtn.click()

    // Fill alias in modal
    await alicePage.getByTestId('add-contact-alias').fill('My Bob')
    await alicePage.getByTestId('add-contact-submit').click()

    await expect(alicePage.getByText('Bob has been added to your contacts', { exact: true })).toBeVisible({
      timeout: 5_000,
    })

    // Navigate to contacts — alias appears
    await alicePage.goto('/contacts')
    await waitForHydration(alicePage)
    await expect(alicePage.getByText('My Bob')).toBeVisible()
  })

  test('SA-05 already-contact user shows badge, not Add button', async ({ alicePage }) => {
    // Add Bob as contact first
    await alicePage.request.post('/api/contacts', {
      data: { userIdToAdd: userIds.bob, alias: 'Bob' },
    })

    await alicePage.goto('/search')
    await waitForHydration(alicePage)
    await alicePage.getByTestId('search-input').fill('Bob')
    await alicePage.waitForResponse(res => res.url().includes('/api/users/search'), {
      timeout: 5_000,
    })

    await expect(
      alicePage
        .getByTestId('search-result-item')
        .filter({ hasText: 'Bob' })
        .getByTestId('contact-badge'),
    ).toBeVisible()
    await expect(
      alicePage
        .getByTestId('search-result-item')
        .filter({ hasText: 'Bob' })
        .getByTestId('add-contact-btn'),
    ).not.toBeVisible()
  })
})

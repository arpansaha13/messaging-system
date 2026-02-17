describe('useNotification Composable', () => {
  it('returns notification with initial state', () => {
    const { notification } = useNotification()

    expect(notification.value.status).toBe('success')
    expect(notification.value.title).toBe('')
    expect(notification.value.description).toBe('')
    expect(notification.value.show).toBe(false)
  })

  it('shows notification with correct payload', () => {
    const { notification, showNotification } = useNotification()
    const payload = {
      status: 'error' as const,
      title: 'Error',
      description: 'Something went wrong',
    }

    showNotification(payload)

    expect(notification.value.status).toBe('error')
    expect(notification.value.title).toBe('Error')
    expect(notification.value.description).toBe('Something went wrong')
    expect(notification.value.show).toBe(true)
  })

  it('shows success notification', () => {
    const { notification, showNotification } = useNotification()
    const payload = {
      status: 'success' as const,
      title: 'Success',
      description: 'Operation completed',
    }

    showNotification(payload)

    expect(notification.value.status).toBe('success')
    expect(notification.value.show).toBe(true)
  })

  it('hides notification', () => {
    const { notification, showNotification, hideNotification } = useNotification()

    showNotification({
      status: 'success',
      title: 'Test',
      description: 'Test description',
    })

    expect(notification.value.show).toBe(true)

    hideNotification()

    expect(notification.value.show).toBe(false)
    expect(notification.value.title).toBe('Test')
    expect(notification.value.description).toBe('Test description')
  })

  it('resets notification to initial state', () => {
    const { notification, showNotification, resetNotification } = useNotification()

    showNotification({
      status: 'error',
      title: 'Error',
      description: 'Error description',
    })

    resetNotification()

    expect(notification.value.status).toBe('success')
    expect(notification.value.title).toBe('')
    expect(notification.value.description).toBe('')
    expect(notification.value.show).toBe(false)
  })

  it('handles multiple show operations', () => {
    const { notification, showNotification } = useNotification()

    showNotification({
      status: 'success',
      title: 'First',
      description: 'First notification',
    })

    expect(notification.value.title).toBe('First')

    showNotification({
      status: 'error',
      title: 'Second',
      description: 'Second notification',
    })

    expect(notification.value.title).toBe('Second')
    expect(notification.value.status).toBe('error')
    expect(notification.value.description).toBe('Second notification')
  })

  it('preserves notification state when hiding', () => {
    const { notification, showNotification, hideNotification } = useNotification()

    const testPayload = {
      status: 'error' as const,
      title: 'Error Title',
      description: 'Error Description',
    }

    showNotification(testPayload)
    hideNotification()

    expect(notification.value.title).toBe('Error Title')
    expect(notification.value.description).toBe('Error Description')
    expect(notification.value.status).toBe('error')
    expect(notification.value.show).toBe(false)
  })
})

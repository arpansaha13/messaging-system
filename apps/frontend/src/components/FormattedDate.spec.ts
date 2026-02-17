import { mount } from '@vue/test-utils'
import FormattedDate from './FormattedDate.vue'

describe('FormattedDate Component', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T10:30:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders time element with correct datetime attribute', () => {
    const dateString = '2024-01-15T10:30:00Z'
    const wrapper = mount(FormattedDate, {
      props: {
        dateString,
      },
    })
    const timeElement = wrapper.find('time')

    expect(timeElement.exists()).toBe(true)
    expect(timeElement.attributes('datetime')).toBe(dateString)
  })

  it("displays only time for today's date", () => {
    const dateString = '2024-01-15T14:45:00'
    const wrapper = mount(FormattedDate, {
      props: {
        dateString,
      },
    })
    const timeElement = wrapper.find('time')
    const text = timeElement.text()

    // Should contain time in 12-hour format
    expect(text).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/)
    expect(text).not.toContain('Yesterday')
  })

  it('displays "Yesterday" prefix for yesterday\'s date', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dateString = yesterday.toISOString()

    const wrapper = mount(FormattedDate, {
      props: {
        dateString,
      },
    })
    const timeElement = wrapper.find('time')
    const text = timeElement.text()

    expect(text).toContain('Yesterday')
  })

  it('displays date, month, and time for older dates', () => {
    const dateString = '2024-01-10T14:45:00'
    const wrapper = mount(FormattedDate, {
      props: {
        dateString,
      },
    })
    const timeElement = wrapper.find('time')
    const text = timeElement.text()

    // Should contain date and time
    expect(text).toMatch(/Jan/)
    expect(text).toMatch(/10/)
    expect(text).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/)
  })

  it('applies correct styling classes', () => {
    const dateString = '2024-01-15T10:30:00Z'
    const wrapper = mount(FormattedDate, {
      props: {
        dateString,
      },
    })
    const timeElement = wrapper.find('time')

    expect(timeElement.classes()).toContain('text-xs')
    expect(timeElement.classes()).toContain('text-gray-500')
    expect(timeElement.classes()).toContain('dark:text-gray-400')
  })
})

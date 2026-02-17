import { mount } from '@vue/test-utils'
import MsgStatusIcon from './MsgStatusIcon.vue'
import { MessageStatus } from '@shared/constants'

describe('MsgStatusIcon Component', () => {
  it('renders sending icon for SENDING status', () => {
    const wrapper = mount(MsgStatusIcon, {
      props: {
        status: MessageStatus.SENDING,
      },
    })

    const icon = wrapper.findComponent({ name: 'Icon' })
    expect(icon.exists()).toBe(true)
    expect(icon.props('name')).toBe('mdi:alarm')
  })

  it('renders sent icon for SENT status', () => {
    const wrapper = mount(MsgStatusIcon, {
      props: {
        status: MessageStatus.SENT,
      },
    })

    const icon = wrapper.findComponent({ name: 'Icon' })
    expect(icon.exists()).toBe(true)
    expect(icon.props('name')).toBe('mdi:check')
  })

  it('renders double check icon for DELIVERED status', () => {
    const wrapper = mount(MsgStatusIcon, {
      props: {
        status: MessageStatus.DELIVERED,
      },
    })

    const icon = wrapper.findComponent({ name: 'Icon' })
    expect(icon.exists()).toBe(true)
    expect(icon.props('name')).toBe('mdi:check-all')
  })

  it('renders double check icon with blue color for READ status', () => {
    const wrapper = mount(MsgStatusIcon, {
      props: {
        status: MessageStatus.READ,
      },
    })

    const icon = wrapper.findComponent({ name: 'Icon' })
    expect(icon.exists()).toBe(true)
    expect(icon.props('name')).toBe('mdi:check-all')
    expect(icon.props('style')).toEqual({ color: '#38bdf8' })
  })

  it('returns null icon for unknown status', () => {
    const wrapper = mount(MsgStatusIcon, {
      props: {
        status: 'UNKNOWN' as any,
      },
    })

    const icon = wrapper.findComponent({ name: 'Icon' })
    expect(icon.exists()).toBe(false)
  })

  it('applies shrink-0 class to icon', () => {
    const wrapper = mount(MsgStatusIcon, {
      props: {
        status: MessageStatus.SENT,
      },
    })

    const icon = wrapper.findComponent({ name: 'Icon' })
    expect(icon.classes()).toContain('shrink-0')
  })

  it('updates icon when status prop changes', async () => {
    const wrapper = mount(MsgStatusIcon, {
      props: {
        status: MessageStatus.SENDING,
      },
    })

    let icon = wrapper.findComponent({ name: 'Icon' })
    expect(icon.props('name')).toBe('mdi:alarm')

    await wrapper.setProps({ status: MessageStatus.SENT })

    icon = wrapper.findComponent({ name: 'Icon' })
    expect(icon.props('name')).toBe('mdi:check')
  })
})

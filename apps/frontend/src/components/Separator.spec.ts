import { mount } from '@vue/test-utils'
import Separator from './Separator.vue'

describe('Separator Component', () => {
  it('renders separator with default styling', () => {
    const wrapper = mount(Separator)
    const div = wrapper.find('div')

    expect(div.exists()).toBe(true)
    expect(div.classes()).toContain('my-1')
    expect(div.classes()).toContain('h-px')
    expect(div.classes()).toContain('w-full')
    expect(div.classes()).toContain('bg-gray-950/10')
    expect(div.classes()).toContain('dark:bg-gray-50/10')
  })

  it('applies custom class when provided', () => {
    const customClass = 'custom-separator-class'
    const wrapper = mount(Separator, {
      props: {
        class: customClass,
      },
    })
    const div = wrapper.find('div')

    expect(div.classes()).toContain(customClass)
    expect(div.classes()).toContain('my-1')
  })

  it('renders without props', () => {
    const wrapper = mount(Separator)

    expect(wrapper.findComponent(Separator).exists()).toBe(true)
  })

  it('renders as a div element', () => {
    const wrapper = mount(Separator)
    const div = wrapper.find('div')

    expect(div.element.tagName).toBe('DIV')
  })
})

import type { StateCreator } from 'zustand'
import type { RequestOptions } from '~/hooks/useFetch'

export type Slice<T> = StateCreator<T, [['zustand/immer', never]], []>

export type FetchHook = (url: string, options?: RequestOptions) => Promise<any>

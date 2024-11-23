import { useEffect } from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { endpointSliceMap, type EndpointNames, type EndpointSliceMap } from './features'
import type { PrefetchOptions } from '@reduxjs/toolkit/query'
import type { AppDispatch, AppStore, RootState } from './store'

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
export const useAppStore = useStore.withTypes<AppStore>()

/**
 * https://redux-toolkit.js.org/rtk-query/usage/prefetching#recipe-prefetch-immediately
 */

export function usePrefetch<T extends EndpointNames>(
  endpoint: T,
  arg: Parameters<EndpointSliceMap[T]['endpoints'][T]['initiate']>[0],
  options: PrefetchOptions = {},
) {
  const dispatch = useAppDispatch()
  useEffect(() => {
    const slice = endpointSliceMap[endpoint]
    // @ts-ignore
    dispatch(slice.util.prefetch(endpoint, arg, options))
  }, [arg, dispatch, endpoint, options])
}

import DefaultLayout from '../layouts/default'
import { useDark } from '../hooks/useDark'

import type { ReactElement, ReactNode } from 'react'
import type { NextPage } from 'next'
import type { AppProps } from 'next/app'

import '../styles/globals.css'

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  useDark()

  // If a layout is not specified then use the default layout
  const getLayout = Component.getLayout ?? ((page) => (
    <DefaultLayout>{ page }</DefaultLayout>
  ))

  return getLayout(<Component {...pageProps} />)
}

export default MyApp

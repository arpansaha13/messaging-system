// Immer
import { enableMapSet } from 'immer'
// Types
import { ReactElement, ReactNode } from 'react'
import type { NextPage } from 'next'
import type { AppProps } from 'next/app'
// Styles
import '../styles/globals.css'
// Layout
import DefaultLayout from '../layouts/default'
// Component
import WIP from '~/components/WIP'

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  // Enable Maps for `Immer`
  enableMapSet()

  // If a layout is not specified then use the default layout
  const getLayout = Component.getLayout ?? (page => <DefaultLayout>{page}</DefaultLayout>)

  return (
    <>
      <div className="block lg:hidden">
        <WIP />
      </div>
      <div className="hidden lg:block">{getLayout(<Component {...pageProps} />)}</div>
    </>
  )
}

export default MyApp

import { Metadata } from 'next'
import { StoreProvider } from '~/providers/StoreProvider'
import { ThemeProvider } from '~/providers/ThemeProvider'
import '~/styles/globals.css'

export const metadata: Metadata = {
  title: 'Messaging System',
  description: 'A Messaging System project',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout(props: Readonly<RootLayoutProps>) {
  const { children } = props

  return (
    <html lang="en">
      {/* Browser extensions like grammarly will add attributes on body causing hydration warnings */}
      <body suppressHydrationWarning className="h-screen w-screen">
        <StoreProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  )
}

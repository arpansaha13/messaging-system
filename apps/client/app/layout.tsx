import { Metadata } from 'next'
import '~/styles/globals.css'

export const metadata: Metadata = {
  title: 'WhatsApp Clone',
  description: 'A WhatsApp Clone project',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
  return (
    <html lang="en">
      {/* Browser extensions like grammarly will add attributes on body causing hydration warnings */}
      <body suppressHydrationWarning className="h-screen w-screen">
        {children}
      </body>
    </html>
  )
}

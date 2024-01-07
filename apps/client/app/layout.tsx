import { Metadata } from 'next'
import '~/styles/globals.css'

export const metadata: Metadata = {
  title: 'WhatsApp Clone',
  description: 'A WhatsApp Clone project',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="en">
      {/* Browser extensions like grammarly will add attributes on body causing hydration warnings */}
      <body suppressHydrationWarning>
        <div className="w-screen h-screen relative">{children}</div>
      </body>
    </html>
  )
}

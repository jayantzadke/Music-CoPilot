import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { SessionProvider } from '@/components/providers/SessionProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Music-CoPilot',
  description: 'Stream music',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <SessionProvider>
          {children}
          <Toaster position="bottom-center" theme="dark" />
        </SessionProvider>
      </body>
    </html>
  )
}

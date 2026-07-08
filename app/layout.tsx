import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Team OS Console',
  description: 'Hackathon team wall: seat health, kanban, ticker',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

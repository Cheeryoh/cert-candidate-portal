import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from 'next-themes'
import { BRAND_NAME } from '@/lib/brand'
import { BrandProvider } from '@/components/brand/brand-context'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: `${BRAND_NAME} Certification Portal`,
  description: `${BRAND_NAME} certification exam candidate portal`,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          <BrandProvider name={BRAND_NAME}>
            {children}
            <Toaster />
          </BrandProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

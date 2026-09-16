import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import Script from 'next/script'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { I18nProvider } from '@/i18n/context'
import { AuthProvider } from '@/contexts/auth-context'
import { AppHeader } from '@/components/app-header'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { getSession } from '@/lib/auth/session'

const lora = localFont({
  src: [
    {
      path: '../../public/fonts/Lora-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Lora-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Lora-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-lora',
  display: 'swap',
})

const GTM_ID = 'GTM-K3KT2MSK'

export const metadata: Metadata = {
  title: 'Quotes',
  description:
    'Search and manage a collection of quotes in Russian and English',
  manifest: '/site.webmanifest',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const session = await getSession()

  return (
    <html lang="en" suppressHydrationWarning className={lora.variable}>
      <head>
        <Script id="gtm-loader" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      </head>
      <body className="min-h-full bg-background text-foreground antialiased">
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <AuthProvider initialRole={session?.role ?? null}>
              <TooltipProvider>
                <div className="flex min-h-screen flex-col">
                  <AppHeader />
                  <main className="flex-1">{children}</main>
                </div>
                <Toaster position="top-center" richColors />
              </TooltipProvider>
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

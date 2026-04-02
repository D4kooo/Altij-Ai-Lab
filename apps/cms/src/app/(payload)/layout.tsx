import type { Metadata } from 'next'
import { RootLayout } from '@payloadcms/next/layouts'
import config from '@/payload.config'
import './custom.scss'

type Args = { children: React.ReactNode }
export const metadata: Metadata = { title: 'Data Ring CMS' }
export default function Layout({ children }: Args) {
  return <RootLayout config={config}>{children}</RootLayout>
}

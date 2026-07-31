import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title:
    'Social Virality Cascade Explorer | Real Rails Intelligence Library',

  description:
    'Distribution & Demand intelligence terminal for exploring synthetic social cascades, propagation concentration, and downstream reach.',

  keywords: [
    'Real Rails',
    'Distribution & Demand',
    'social virality',
    'cascade analysis',
    'propagation',
    'network intelligence',
    'synthetic cascade',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-rails-obsidian font-sans text-rails-text">
        {children}
      </body>
    </html>
  );
}
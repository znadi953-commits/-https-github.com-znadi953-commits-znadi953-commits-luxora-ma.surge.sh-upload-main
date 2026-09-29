import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'لوكسورا 360° | LUXORA MA — ضيافة مغربية بروح الحرفية',
  description:
    'لوكسورا: صناعة مغربية أصيلة — شاي مغربي، زليج، حرف يدوية وخِدْمات ضيافة 360° لكل مدن المملكة.',
  keywords: ['لوكسورا', 'LUXORA', 'المغرب', 'حرف يدوية', 'زليج', 'شاي مغربي', 'ضيافة'],
  openGraph: {
    title: 'لوكسورا 360° | LUXORA MA',
    description: 'ضيافة مغربية أصيلة بروح حرفية 360°.',
    locale: 'ar_MA',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#070a14',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&family=Amiri:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#070a14] text-amber-50 antialiased">{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import '@fontsource/inter';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'SB Lead Intel',
  description: 'Sales Intelligence Platform by Standard Bots',
  keywords: ['leads', 'intelligence', 'sales', 'automation'],
  openGraph: {
    title: 'SB Lead Intel',
    description: 'Sales Intelligence Platform by Standard Bots',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <div className="min-h-screen bg-sb-bg text-sb-text">
          {children}
        </div>
      </body>
    </html>
  );
}

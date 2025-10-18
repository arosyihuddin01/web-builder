import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Renderer Demo',
  description: 'Next.js + Tailwind demo rendering JSON nodes recursively',
  viewport: 'width=device-width, initial-scale=1'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}

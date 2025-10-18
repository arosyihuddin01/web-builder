import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Editor App',
  description: 'A Next.js 13 editor scaffold with Tailwind CSS',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}

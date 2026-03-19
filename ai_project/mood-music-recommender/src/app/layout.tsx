   import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mood Music Recommender',
  description: 'Discover music that matches your mood',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
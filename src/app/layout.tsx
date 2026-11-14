import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { Providers } from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'MAYA AI | Hallucination Detection & Confidence Estimation',
  description:
    'MAYA AI — An advanced AI assistant that detects hallucinations, calculates confidence scores, and retrieves verified evidence before every response.',
  keywords: ['AI', 'hallucination detection', 'RAG', 'fact verification', 'chatbot'],
  openGraph: {
    title: 'MAYA AI',
    description: "AI That Knows When It Doesn't Know",
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Non-blocking Google Fonts — app renders instantly with system fonts as fallback */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Providers>
            {children}
            <Toaster position="top-right" theme="dark" richColors />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}

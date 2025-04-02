import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { AIProvider } from '@/components/providers/ai-provider';
import { LanguageProvider } from '@/components/providers/language-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MyFitCoach.AI - Smart Weight Tracking',
  description: 'AI-powered weight tracking and nutrition analysis',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <LanguageProvider>
            <AIProvider>
              {children}
              <Toaster />
            </AIProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
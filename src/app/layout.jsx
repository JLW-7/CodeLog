'use client';

import "./globals.css";
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';
import { useRouter, usePathname } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import ThemeToggle from '@/components/ui/theme-toggle'; // ✅ default import

export default function RootLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="light">
            <header className="border-b">
              <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
                <a href="/" className="flex items-center gap-2">
                  <span className="text-2xl">🦓</span>
                  <span className="font-semibold text-xl">Zebra</span>
                </a>
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => router.push('/dashboard')} 
                    className={`text-sm font-medium transition-colors hover:text-primary ${pathname === '/dashboard' ? 'text-primary' : ''}`}
                  >
                    Dashboard
                  </button>
                  <button 
                    onClick={() => router.push('/timer')} 
                    className={`text-sm font-medium transition-colors hover:text-primary ${pathname === '/timer' ? 'text-primary' : ''}`}
                  >
                    Timer
                  </button>
                  <button 
                    onClick={() => router.push('/projects')} 
                    className={`text-sm font-medium transition-colors hover:text-primary ${pathname === '/projects' ? 'text-primary' : ''}`}
                  >
                    Projects
                  </button>
                  <div className="flex items-center gap-4">
                    <ThemeToggle />
                  </div>
                </div>
              </nav>
            </header>
            <main className="flex-1">
              {children}
            </main>
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

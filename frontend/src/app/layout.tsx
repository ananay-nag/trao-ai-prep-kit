import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Outfit } from 'next/font/google';
import './globals.css';
import Header from './components/Header';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Trao AI Interview Prep Kit',
  description: 'AI-Powered Custom Interview Preparation Kits from Job Descriptions and Company Research',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${jakarta.variable} ${outfit.variable}`}>
      <body className="antialiased font-sans selection:bg-emerald-500 selection:text-white">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-8rem)]">
          {children}
        </main>

        <footer className="border-t border-slate-800/60 bg-slate-950/60 backdrop-blur-md py-6 text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span>Developed with ❤️ by</span>
              <span className="font-bold text-emerald-400 tracking-wide">ANANYA NAG</span>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium">
              <a
                href="https://github.com/ananyanag"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 transition-colors"
              >
                <span>GitHub</span>
              </a>

              <span className="text-slate-700">•</span>

              <a
                href="https://linkedin.com/in/ananyanag"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-slate-400 hover:text-teal-400 transition-colors"
              >
                <span>Profile</span>
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

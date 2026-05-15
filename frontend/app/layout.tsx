// app/layout.tsx
//
// Layout raíz de Next.js App Router.
// Todo lo que pongas aquí se renderiza en CADA página de la app.
// Es el equivalente al _app.tsx de Pages Router (si lo conocés).
//
// Acá definimos:
//   - metadata: el <title> y <meta description> que usan los buscadores
//   - Fuentes globales
//   - El HTML base que envuelve todo

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ToastProvider } from '@/context/ToastContext';
import { Toaster } from '@/components/Toaster';
import './globals.css';

// next/font carga las fuentes de Google de forma óptima:
// las descarga en build time, las sirve localmente, sin flash de fuente genérica
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Workflow Dashboard',
  description: 'Automation workflow management panel',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 text-slate-900">
        <ToastProvider>
          {children}
          <Toaster />
        </ToastProvider>
      </body>
    </html>
  );
}

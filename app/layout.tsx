import { type ReactNode } from 'react';
import "./globals.css";

import { Providers } from './providers';

export default function RootLayout(props: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{props.children}</Providers>
      </body>
    </html>
  );
}
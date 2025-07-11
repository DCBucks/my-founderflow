import './globals.css';
import './style-new.css';
import { ClerkProvider } from '@clerk/nextjs';

export const metadata = {
  title: 'FounderFlow - Daily Habits & Motivation',
  description: 'A productivity app with habit tracking, calendar, and motivational quotes',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      </head>
      <body>
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}

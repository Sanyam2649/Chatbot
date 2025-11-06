// app/layout.js
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata = {
  title: 'AI Chat - Intelligent Document Analysis',
  description: 'Advanced AI chatbot for document analysis and intelligent conversations',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-gray-50">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
import "./globals.css";
import "./style-new.css";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
  title: "FounderFlow - Daily Habits & Motivation",
  description:
    "A productivity app with habit tracking, calendar, and motivational quotes",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
          />
        </head>
        <body>
          {children}
          {/* AI Chatbot Widget */}
          <script src="https://testmyprompt.com/widget/687ad0e4039a1de0dd790699/widget.js"></script>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Initialize the widget after the script loads
                document.addEventListener('DOMContentLoaded', function() {
                  if (window.AIChatWidget) {
                    window.AIChatWidget.init({
                      widgetId: "687ad0e4039a1de0dd790699"
                    });
                  }
                });
              `,
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}

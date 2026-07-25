import type { Metadata } from "next";
import "./globals.css";
import NavBar from "./NavBar";
import { IssueProvider } from "./IssueProvider";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "AMR Hub",
    template: "%s | AMR Hub",
  },
  description:
    "A focused issue triage and product delivery workspace for modern software teams.",
  openGraph: {
    title: "AMR Hub",
    description: "Track the work that needs attention.",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1731,
        height: 909,
        alt: "AMR Hub issue workspace overview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AMR Hub",
    description: "Track the work that needs attention.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <IssueProvider>
          <div className="app-shell">
            <NavBar />
            <main className="app-content">{children}</main>
          </div>
        </IssueProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import "./retro.css";
import { AppShell } from "./AppShell";

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
        url: "/og-retro.png",
        width: 1729,
        height: 910,
        alt: "AMR Hub retro operations console",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AMR Hub",
    description: "Track the work that needs attention.",
    images: ["/og-retro.png"],
  },
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("amr-hub-theme");
    if (stored === "dark" || stored === "light") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (error) {}
})();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Browsers strip the nonce attribute from the DOM after using it
            (so an XSS payload can't read and reuse it), which otherwise
            shows up as a spurious hydration mismatch on every load. */}
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

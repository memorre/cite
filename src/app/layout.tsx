import type { Metadata, Viewport } from "next";
import "./globals.css";
import { auth } from "@/auth";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getLocale());
  return {
    title: { default: t.meta.title, template: "%s · Cite" },
    description: t.meta.description,
    applicationName: "Cite",
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [locale, session] = await Promise.all([getLocale(), auth()]);

  return (
    <html lang={locale} suppressHydrationWarning className="h-full">
      <body className="flex min-h-full flex-col">
        <Providers locale={locale} dictionary={getDictionary(locale)} session={session}>
          <SiteHeader />
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  );
}

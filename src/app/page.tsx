import type * as React from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Blocks,
  FileUp,
  LibraryBig,
  MessageCircleQuestion,
  Quote,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { auth } from "@/auth";
import { getI18n } from "@/i18n/server";
import { AppIcon } from "@/components/app-icon";
import { CitationText } from "@/components/citation-text";
import { Button } from "@/components/ui/button";
import { RevealGroup } from "@/components/reveal-group";

const delay = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default async function Home() {
  const [{ t, f }, session] = await Promise.all([getI18n(), auth()]);
  const signedIn = Boolean(session?.user);
  const l = t.landing;

  const steps = [
    { icon: Upload, ...l.steps.upload },
    { icon: MessageCircleQuestion, ...l.steps.ask },
    { icon: BadgeCheck, ...l.steps.verify },
  ];

  const features = [
    { icon: FileUp, ...l.features.upload },
    { icon: Quote, ...l.features.receipts },
    { icon: ShieldCheck, ...l.features.grounded },
    { icon: Sparkles, ...l.features.streaming },
    { icon: LibraryBig, ...l.features.library },
    { icon: Blocks, ...l.features.langchain },
  ];

  return (
    <RevealGroup>
      {/* Hero */}
      <section className="px-4 pb-16 pt-16 text-center sm:px-6 sm:pt-24 md:pb-24 md:pt-28">
        <div className="mx-auto flex max-w-[980px] flex-col items-center">
          <div className="rise mb-6">
            <AppIcon size={76} />
          </div>
          <p className="rise text-[17px] font-semibold text-muted sm:text-[21px]" style={delay(1)}>
            {l.eyebrow}
          </p>
          <h1
            className="rise mt-2 text-[clamp(40px,11vw,96px)] font-bold leading-[1.05] tracking-headline"
            style={delay(2)}
          >
            {l.title}
          </h1>
          <p
            className="headline rise mt-3 text-[clamp(26px,4.6vw,48px)] font-semibold leading-[1.12] tracking-headline text-balance"
            style={delay(3)}
          >
            <span className="text-gradient">{l.subtitle}</span>
          </p>
          <p
            className="rise mx-auto mt-6 max-w-[640px] text-[17px] leading-[1.5] text-muted text-balance sm:text-[21px]"
            style={delay(4)}
          >
            {l.lead}
          </p>
          <div
            className="rise mt-9 flex flex-wrap items-center justify-center gap-x-8 gap-y-4"
            style={delay(5)}
          >
            {signedIn ? (
              <Button size="lg" asChild>
                <Link href="/library">{l.ctaLibrary}</Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link href="/login">{l.ctaPrimary}</Link>
                </Button>
                <Link href="/login" className="link-more text-[17px]">
                  {l.ctaDemo}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Product preview: what an answer with citations looks like */}
        <figure
          aria-label={l.preview.label}
          className="rise mx-auto mt-16 w-full max-w-[680px] rounded-[28px] bg-background-alt p-4 text-left sm:mt-20 sm:p-8"
          style={delay(6)}
        >
          <div className="flex flex-col gap-3">
            <div className="flex justify-end">
              <p className="max-w-[85%] rounded-[20px] rounded-br-[6px] bg-primary px-4 py-2.5 text-[15px] text-primary-foreground">
                {l.preview.question}
              </p>
            </div>
            <div className="flex max-w-[92%] flex-col gap-2">
              <p className="rounded-[20px] rounded-bl-[6px] bg-surface px-4 py-2.5 text-[15px] shadow-card">
                <CitationText text={l.preview.answer} label={t.chat.citation} />
              </p>
              <div className="flex items-start gap-3 rounded-[14px] bg-surface p-3 shadow-card">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-semibold text-link">
                  1
                </span>
                <div className="min-w-0 text-[13px]">
                  <p className="truncate font-medium">
                    {l.preview.file} · {f(t.chat.page, { page: 4 })}
                  </p>
                  <p className="mt-0.5 text-muted">{l.preview.quote}</p>
                </div>
              </div>
            </div>
          </div>
        </figure>
      </section>

      {/* How it works */}
      <section className="px-4 py-20 sm:px-6 md:py-28">
        <div className="mx-auto max-w-[980px]">
          <h2 className="reveal mb-12 text-[clamp(32px,5.2vw,56px)] font-semibold leading-[1.08] tracking-headline md:mb-16">
            {l.steps.title}
            <span className="block text-muted">{l.steps.subtitle}</span>
          </h2>
          <ol className="grid gap-10 sm:grid-cols-3 sm:gap-8">
            {steps.map((step, i) => (
              <li key={step.title} className="reveal flex flex-col gap-3 border-t border-border pt-6" style={delay(i)}>
                <div className="flex items-center gap-3">
                  <span className="text-[15px] font-semibold tabular-nums text-muted">{i + 1}</span>
                  <step.icon className="h-6 w-6 text-link" strokeWidth={1.8} aria-hidden="true" />
                </div>
                <h3 className="text-[21px] font-semibold leading-tight tracking-headline">{step.title}</h3>
                <p className="text-[17px] text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section className="bg-background-alt px-4 py-20 sm:px-6 md:py-28">
        <div className="mx-auto max-w-[980px]">
          <h2 className="reveal mb-12 text-[clamp(32px,5.2vw,56px)] font-semibold leading-[1.08] tracking-headline md:mb-16">
            {l.features.title}
            <span className="block text-muted">{l.features.subtitle}</span>
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <div key={feature.title} className="reveal" style={delay(i % 3)}>
                <article className="flex h-full flex-col rounded-[28px] bg-surface p-7 shadow-card transition-[scale,box-shadow] duration-500 ease-[var(--ease)] sm:p-8 hover:scale-[1.015] hover:shadow-card-hover">
                  <feature.icon className="mb-6 h-8 w-8 text-link" strokeWidth={1.6} aria-hidden="true" />
                  <h3 className="text-[21px] font-semibold leading-tight tracking-headline">{feature.title}</h3>
                  <p className="mt-2.5 text-[17px] text-muted">{feature.body}</p>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="px-4 py-20 text-center sm:px-6 md:py-28">
        <div className="reveal mx-auto flex max-w-[680px] flex-col items-center">
          <h2 className="text-[clamp(32px,5.2vw,56px)] font-semibold leading-[1.08] tracking-headline">{l.cta.title}</h2>
          <p className="mt-4 text-[17px] text-muted sm:text-[21px]">{l.cta.body}</p>
          <div className="mt-8">
            <Button size="lg" asChild>
              <Link href={signedIn ? "/library" : "/login"}>{signedIn ? l.ctaLibrary : l.cta.button}</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="bg-background-alt px-4 sm:px-6">
        <div className="mx-auto flex max-w-[980px] flex-col gap-2 border-t border-border py-5 text-[12px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="font-medium text-foreground/80">Cite</span> · {l.footer.note}
          </p>
          <a href="https://yetao.org" className="link-more shrink-0">
            {l.footer.more}
          </a>
        </div>
      </footer>
    </RevealGroup>
  );
}

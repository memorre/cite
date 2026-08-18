"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, BookOpen, FileText, MessagesSquare, Quote, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const FEATURES = [
  {
    icon: FileText,
    title: "Drop in a PDF",
    desc: "Upload a document and Cite parses, chunks, and embeds it automatically — no manual setup.",
  },
  {
    icon: Quote,
    title: "Answers with receipts",
    desc: "Every response cites the exact passage and page it came from — click through to verify it yourself.",
  },
  {
    icon: ShieldCheck,
    title: "Grounded, not guessed",
    desc: "Cite only answers from what's actually in your documents, and says so plainly when it can't find the answer.",
  },
  {
    icon: MessagesSquare,
    title: "Streams as it thinks",
    desc: "Responses appear token-by-token, the same way a real assistant would type them out.",
  },
  {
    icon: BookOpen,
    title: "A real library",
    desc: "Every upload lives in your library — searchable across every conversation, not just the one it started in.",
  },
  {
    icon: Sparkles,
    title: "Built on LangChain",
    desc: "Retrieval, chunking, and generation are composed with LangChain.js — swappable models, transparent pipeline.",
  },
];

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div className="bg-mesh pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px]" />

      {/* Hero */}
      <section className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 pb-20 pt-20 text-center sm:px-6 md:pt-28">
        <motion.span
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-medium text-muted"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" /> A document Q&amp;A assistant, grounded in your sources
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl"
        >
          Ask your documents.{" "}
          <span className="bg-gradient-to-r from-[#059669] to-[#b45309] bg-clip-text text-transparent">
            Get answers with receipts.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="max-w-xl text-balance text-muted"
        >
          Upload a PDF, ask questions in plain language, and get answers grounded in the actual text — with the
          exact passage and page cited every time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <Button size="lg" asChild>
            <Link href="/login">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/login">Try the demo account</Link>
          </Button>
        </motion.div>

        {/* Floating preview card */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 w-full max-w-2xl"
        >
          <Card className="glass p-5 text-left shadow-2xl">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-2.5 w-2.5 animate-pulse-ring rounded-full bg-accent" />
              <p className="text-sm font-medium">What was the refund window?</p>
            </div>
            <div className="rounded-xl bg-surface-2 p-3 text-sm text-muted">
              Refunds are available within 30 days of purchase, provided the item is unused [1].
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-border bg-surface p-2.5 text-xs">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[10px] font-semibold text-primary">
                1
              </span>
              <div>
                <p className="font-medium">terms-of-service.pdf · p.4</p>
                <p className="mt-0.5 text-muted">&ldquo;...items may be returned within 30 days of the original purchase date...&rdquo;</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Retrieval-augmented, not made up</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
            Every answer is traceable back to the document it came from.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: (i % 3) * 0.08 }}
            >
              <Card className="h-full p-5 transition-transform hover:-translate-y-1 hover:shadow-lg">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mb-1 font-semibold">{f.title}</h3>
                <p className="text-sm text-muted">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 pb-24 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass relative overflow-hidden p-8 text-center sm:p-12">
            <div className="bg-mesh pointer-events-none absolute inset-0 -z-10 opacity-60" />
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ready to see it live?</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Sign in with the demo account — no setup required.
            </p>
            <Button size="lg" className="mt-6" asChild>
              <Link href="/login">
                Sign in <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Card>
        </motion.div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted">
        Cite — a portfolio build. Not affiliated with any document management service.
      </footer>
    </div>
  );
}

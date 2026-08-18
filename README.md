# Cite — Ask Your Documents

A document Q&A assistant. Upload a PDF, ask questions in plain language, and get answers grounded in the actual
text — with the exact passage and page cited every time. Built on LangChain.js for retrieval and generation.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack) | Server Components for the library/chat UI, Route Handlers for upload and streamed chat responses. |
| Language | TypeScript | End-to-end types from schema to UI. |
| Styling | Tailwind CSS v4 + hand-rolled Radix UI primitives | Same design-system approach as the rest of this portfolio, a third palette (emerald/amber). |
| Animation | Motion (Framer Motion) | Page transitions, list reveals, a blinking cursor while responses stream. |
| RAG | [LangChain.js](https://js.langchain.com) v1 | Chunking (`@langchain/textsplitters`), embeddings + chat models (`@langchain/openai`, `@langchain/anthropic`), composed by hand rather than through `@langchain/community`'s vector-store integrations (see below). |
| PDF parsing | `pdf-parse` v2 | Per-page text extraction, so every chunk keeps an exact source page for citations. |
| Vector search | Postgres + `pgvector` | Embeddings live in a real `vector(1536)` column with cosine-distance search — no separate vector DB service. |
| Data | Prisma ORM 7 + Postgres (Prisma Postgres via Vercel Marketplace) | Same database for local dev and production. |
| Auth | Auth.js (NextAuth v5), credentials + JWT sessions | Single demo account; every document/conversation is scoped to its owner. |

### Why pgvector instead of a vector database service

`@langchain/community`'s vector-store integrations pull in a large dependency surface (and, at the time this was
built, had a peer-dependency conflict between `@langchain/core` versions). Since Postgres was already the
database for this pilot, enabling the `vector` extension and writing ~30 lines of raw SQL
([`src/lib/vector.ts`](src/lib/vector.ts)) was simpler than adding a second managed service (Pinecone, Qdrant
Cloud, etc.) and an extra API key to the deployment. At this project's scale (a personal document library, not a
multi-tenant SaaS), a sequential `ORDER BY embedding <=> $1` scan is fast enough that an ANN index (IVFFlat/HNSW)
isn't worth the added complexity yet — see Known limitations.

## Getting started

```bash
npm install
cp .env.example .env        # then set DATABASE_URL, AUTH_SECRET, and an LLM key — see below
npm run db:push              # applies schema (including the pgvector extension) to your Postgres database
npm run db:seed              # seeds a demo account — no documents are pre-seeded, see below
npm run dev
```

`DATABASE_URL` needs a Postgres instance with the `vector` extension available (Prisma Postgres, Neon, and
Supabase all support it). Easiest path: `vercel link`, then `vercel integration add prisma/prisma-postgres`, then
`vercel env pull .env.local` — see [Deployment](#deployment). Generate `AUTH_SECRET` with:

```bash
openssl rand -base64 32
```

For the LLM, set **one** of:

```bash
OPENAI_API_KEY="sk-..."       # used for chat AND embeddings
ANTHROPIC_API_KEY="sk-ant-..." # used for chat only — embeddings still need OPENAI_API_KEY, see below
```

Open http://localhost:3000. The login page has a one-click demo account: `demo@cite.app` / `password123`. No
documents are pre-seeded — embedding sample content requires a live API key at seed time, so upload a PDF
yourself after signing in.

### Why embeddings always use OpenAI

Anthropic has no first-party embeddings API. If `ANTHROPIC_API_KEY` is set for chat, embeddings still need
`OPENAI_API_KEY` — the app runs with **chat only** disabled if that's missing, and shows exactly that in the UI
(the library page's "no API key" banner, and the chat input's disabled placeholder) rather than failing silently.

## Architecture and data model

```
User ──< Document ──< Chunk (content, page, embedding: vector(1536))
  └──< Conversation ──< Message (role, content, citations: Json)
```

- **Upload** ([`src/app/api/upload/route.ts`](src/app/api/upload/route.ts)) parses the PDF page-by-page
  (`src/lib/pdf.ts`), chunks each page's text with `RecursiveCharacterTextSplitter` (`src/lib/chunk.ts` — 1000
  chars, 150 overlap), and stores chunks immediately. **Parsing and chunking need no LLM key.** Embedding
  (`src/lib/ingest.ts`) runs right after, in batches of 50 chunks; if no key is configured or the call fails, the
  document is marked `FAILED` with a clear reason and chunks are left in place — "Retry" on the library page
  re-runs just the embedding step once a key is available, without re-uploading.
- **Chat** ([`src/app/api/chat/[id]/route.ts`](src/app/api/chat/[id]/route.ts)) embeds the question, does a
  cosine-distance nearest-neighbour search across every one of the user's `READY` documents
  (`src/lib/vector.ts`), and streams a grounded answer (`src/lib/rag.ts`) — the system prompt instructs the model
  to answer only from the retrieved excerpts and to say so when it can't. The response streams as plain text,
  followed by a `\n\n<<CITATIONS>>` marker and a JSON payload the client parses out — a small hand-rolled
  protocol, chosen over the Vercel AI SDK's data-stream format to keep this one round-trip dependency-free.
- Upload goes through a Route Handler rather than a Server Action specifically so it can export
  `maxDuration = 60` — Next.js server actions don't support that segment config, which surfaced as a genuinely
  confusing "module has no exports" build error the first time (a `"use server"` file's exports must all be
  async functions; a stray non-function export broke the entire module's codegen).

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string; needs the `vector` extension available. |
| `AUTH_SECRET` | Yes | Signs session JWTs. Generate with `openssl rand -base64 32`. |
| `OPENAI_API_KEY` | For embeddings + optionally chat | Required for any embedding to happen at all. |
| `ANTHROPIC_API_KEY` | For chat only | Optional alternative chat model; embeddings still need `OPENAI_API_KEY`. |

## Deployment

Deployed on **Vercel**, database on **Prisma Postgres** (via the Vercel Marketplace, with the `vector` extension
enabled). This is what was actually run:

```bash
npm install -g vercel
vercel login
vercel link --yes
vercel integration add prisma/prisma-postgres
vercel env pull .env.local

npm run db:push
npm run db:seed
vercel env add AUTH_SECRET production        # paste the output of: openssl rand -base64 32
vercel env add OPENAI_API_KEY production      # when available
vercel env add ANTHROPIC_API_KEY production   # optional
vercel --prod
```

**Migrations vs. `db push`:** this project uses `prisma db push` instead of `prisma migrate dev`/`deploy`.
Prisma Postgres (the managed service) auto-installs its own `prisma_postgres` extension on the database, which
`migrate dev` sees as unexplained "drift" against migration history and wants to reset on every run — a loop
with no clean exit via migrations. `db push` diffs the live schema directly and isn't affected. For a
single-environment pilot this trade-off (no migration history) is acceptable; a team scaling this past a pilot
would want to either wait for that drift-detection quirk to be fixed upstream, or manage migrations against a
non-Prisma-Postgres Postgres instance.

## Known limitations and future backlog

- **No ANN index on the embedding column** — a sequential cosine-distance scan (`ORDER BY embedding <=> $1`) is
  fine at hundreds-to-low-thousands of chunks, but would need an IVFFlat or HNSW index (`CREATE INDEX ... USING
  hnsw`) before scaling to a large multi-user library.
- **Chat always searches every `READY` document** — there's no per-conversation scoping to a subset of the
  library. Adding a join table (`ConversationDocument`) and a picker in the "New chat" flow is the natural next
  step if a user's library grows large enough that cross-document search gets noisy.
- **No conversation renaming** — titles are set from the first message and never editable.
- **4MB upload limit**, enforced client-side and server-side, to stay under Vercel serverless functions' request
  body ceiling (~4.5MB on the Hobby tier). Larger PDFs would need direct-to-blob-storage upload with a signed
  URL, bypassing the serverless function body limit entirely.
- **No OCR** — scanned PDFs with no embedded text layer produce zero chunks and the document is marked `FAILED`
  with a message saying so, rather than silently succeeding with nothing to search.
- **No automated test suite** — manually verified: PDF parsing/chunking against a real multi-page PDF, the
  missing-key failure path (document correctly marked `FAILED` with the right message), document delete, and the
  full UI (library, chat empty/disabled states, light/dark, mobile). The actual embedding call and LLM generation
  are implemented against the exact LangChain.js v1 API (verified against the installed package's type
  definitions) but weren't exercised end-to-end during development, since that requires a live API key.

## Project structure

```
prisma/                     schema (Document/Chunk/Conversation/Message + pgvector), seed script
src/
  app/
    page.tsx                 landing page
    login/                    credentials login + demo account
    library/                  document list, upload dialog, status badges
    chat/                     conversation sidebar (layout.tsx) + chat thread ([id]/)
    api/
      upload/                 PDF upload → parse → chunk → embed (Route Handler, maxDuration=60)
      chat/[id]/               retrieval + streamed, cited generation
      documents/, conversations/  list endpoints for SWR polling
  components/                design system (ui/) + qr-free reusable pieces
  lib/
    pdf.ts, chunk.ts           parsing + chunking (no LLM key needed)
    llm.ts                     provider selection (OpenAI/Anthropic chat, OpenAI embeddings)
    ingest.ts                  embedding pipeline + FAILED/READY status transitions
    vector.ts                  raw pgvector SQL (Prisma has no native vector scalar)
    rag.ts                     retrieval + prompt construction + streaming
  auth.ts                     Auth.js configuration
```

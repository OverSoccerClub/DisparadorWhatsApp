## Quick orientation for AI coding agents

This repo is a Next.js 14 (App Router) TypeScript web app for managing WhatsApp dispatches. Below are the essential facts an agent needs to be productive immediately.

- Architecture overview
  - Frontend + server (Next.js App Router) lives under `app/` (React server and client components). Edit UI in `components/` and app routes in `app/`.
  - Persistent state and auth: Supabase (see `supabase/` and use env vars in `.env.local`). Key files: `supabase/schema.sql`, `docs/` and `docs/environment-setup.md`.
  - Messaging pipeline: WhatsApp integration via `baileys` + sessions in `sessions/`. QR images saved under `public/` (look for `public/qr-code.png`).
  - Background processing: `bull` queues backed by Redis. Redis URL controlled by `REDIS_URL` env var.

- Important files & commands
  - `package.json` scripts: use `npm run dev` (local), `npm run build:prod` then `npm run start:prod` (production), `npm run docker:run` / `npm run docker:build` for Docker. See `scripts/` for environment-specific helpers (Windows PowerShell and bash variants exist).
  - Setup helpers: `npm run setup` and `npm run setup-waha` / `npm run setup-waha-db` for WhatsApp-related provisioning.
  - Deployment: `scripts/deploy.ps1` or `deploy.sh`; `docker-compose.yml` and `docker-compose.prod.yml` exist.

- Project conventions and patterns
  - App Router + server components: prefer adding route handlers under `app/api/` and UI under `app/*` and `components/`.
  - TypeScript-first; keep types and props explicit. Follow existing style in `components/` (functional components, hooks in `hooks/`).
  - Tailwind CSS for styling — classes directly on JSX. Reusable UI is in `components/` (e.g., `Header.tsx`, `Sidebar.tsx`).
  - Templates use `{{nome}}`, `{{email}}`, `{{telefone}}` variable placeholders — preserve when editing message-generation code.

- Integration points to watch for when editing code
  - Supabase calls: prefer server-side usage when using `SUPABASE_SERVICE_ROLE_KEY` (check `app/api` routes and `lib/` wrappers).
  - WhatsApp sessions: file-backed under `sessions/`; do not remove files unless intentionally resetting sessions. When simulating connections, check `components/WhatsAppPreview*` and `waha-sessions` routes.
  - Queue workers and jobs: look for queue construction and processors (search for `new Queue` or `bull`). Changing message flow likely requires updates to both the enqueuer (UI/API) and the worker code.

- Useful examples and pointers
  - Run locally: `npm install && npm run dev` (Next listens on 3000). Env file: copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `REDIS_URL`, `NEXT_PUBLIC_APP_URL`.
  - Regenerate QR / sessions: the QR lifecycle is managed by Baileys code and saved to `sessions/` and `public/qr-code.png` — check `app/configuracoes/` pages and `Waha*` components.
  - Production docker: `npm run docker:build` then `npm run docker:prod`.

- Safety and non-obvious requirements
  - Never commit secret keys — the repo uses service role keys for server actions; `SUPABASE_SERVICE_ROLE_KEY` must remain server-only.
  - On Windows, many helper scripts call PowerShell (`scripts/*.ps1`). Use the `-ExecutionPolicy Bypass` forms provided in `package.json` scripts.

- When changing message dispatch logic
  - Update: (1) API that enqueues messages, (2) any queue processors, (3) templates and validation (phone formatting). Example files: `app/api/disparos/`, `hooks/useRealtimeProgress.ts`, and workers under `lib/` or `scripts/` if present.

If anything in this file is unclear or you'd like more examples (e.g., typical code edit + test cycle for a queue change), tell me which area to expand and I will iterate. 

## Checklist: editar → testar → verificar (tarefas comuns)

Use este checklist sempre que fizer mudanças em UI, APIs ou no processamento de filas. Ele foca em passos repetíveis, comandos e arquivos a verificar.

- Antes de começar
  - Garanta `NODE_ENV` correto e `.env.local` configurado (copie de `.env.example`).
  - Tenha o Redis rodando localmente (`redis-server` ou via Docker) e `REDIS_URL` apontando para ele.

- 1) UI (componentes / páginas)
  - Contrato rápido: inputs/props esperados, output (UI state), e side-effects (chamadas a APIs). Verifique `components/*` e `app/*`.
  - Passos:
    1. Faça a alteração no componente (ex.: `components/DisparoModal.tsx`).
    2. Rodar o app: `npm run dev` e abrir `http://localhost:3000`.
    3. Teste interações manuais e fluxos (form submit, validações). Use o console do navegador para erros.
    4. Verifique chamados de API no `Network` (procure `app/api/*` endpoints invocados).

- 2) API (rotas server / handlers)
  - Contrato rápido: entrada (body/query), efeitos (DB/filas), resposta e códigos de erro.
  - Passos:
    1. Modifique a rota em `app/api/...` (ex.: `app/api/disparos/`).
    2. Reinicie o servidor de desenvolvimento se necessário (`npm run dev` reinicia automaticamente em muitos casos).
    3. Use `curl` ou o frontend para disparar a rota e validar respostas.
    4. Verifique logs no terminal para exceptions e no Supabase (dados persistidos).

- 3) Workers / Filas (Bull + Redis)
  - Onde procurar: `lib/queue.ts` (filas registradas: `campaign processing`, `whatsapp messages`), processors e quaisquer `new Queue(...)`.
  - Contrato rápido: job data shape, retries, side-effects (envio WAHA/Baileys, DB updates).
  - Passos:
    1. Localize o worker/processor (procure por `queue.process` ou por arquivos em `lib/` que exportam filas).
    2. Se existirem scripts de worker (ex.: `scripts/worker.js`), execute-os; caso contrário, o processamento pode ocorrer dentro do processo do servidor (inspecione `lib/queue.ts`).
    3. Com Redis rodando, enfileire um job (use API ou console) e verifique processamento e logs.
    4. Teste cenários de retry/falha (forçar erro controlado no processor) e confirme comportamento de requeue e backoff.

- Verificações finais
  - Teste de ponta a ponta: UI → API → fila → worker → verifique DB (`supabase`) e status da mensagem.
  - Confirme não expor `SUPABASE_SERVICE_ROLE_KEY` no frontend.
  - Adicione/atualize um pequeno teste manual ou script de verificação (ex.: `scripts/smoke-check.js`) quando apropriado.

Se quiser, eu posso inserir exemplos pequenos de comando/curl ou um script de smoke test para automatizar as verificações.

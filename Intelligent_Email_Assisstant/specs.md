INTELLIGENT EMAIL ASSISTANT — PROJECT SPECIFICATION SHEET
Difficulty: Medium (Recommended)
Category: AI-Powered Productivity Application

===================================================
1. PROJECT OVERVIEW
===================================================
The Intelligent Email Assistant is a full-stack web application that connects to a user's real Gmail account via OAuth 2.0 and layers AI capabilities on top of standard inbox management. Users can read, search, organize, and manage their email through a dashboard, while an AI engine handles summarization, reply generation, tone adjustment, and (bonus scope) classification, prioritization, and action-item extraction.

Core value: reduce time spent processing email — open a long thread, get an instant AI summary, request a reply in one click, edit the AI draft, and send, all without leaving the app.

Primary user flow:
Connect Gmail -> OAuth Consent -> Fetch Emails -> Dashboard -> Open Email -> Summarize -> Generate Reply -> Edit -> Send

===================================================
2. TECH STACK
===================================================
- Frontend: React (Vite) + TypeScript — component-driven, fast dev loop
- Styling: Tailwind CSS + shadcn/ui — consistent design system, accessible components
- State Management: React Query (server state) + Zustand (UI state) — separates caching from local state
- Backend: Node.js + Express (or NestJS for structure) — REST API, TypeScript throughout
- Database: PostgreSQL via Prisma ORM — relational data for users, tokens, email metadata, activity logs
- Cache/Queue: Redis + BullMQ — token refresh jobs, async AI summarization jobs
- AI Provider: Anthropic Claude API (or OpenAI as alternative) — summarization, reply generation, classification
- Email Provider: Gmail API (googleapis SDK) — OAuth 2.0, message fetch/send/modify
- Auth: OAuth 2.0 (Google) + JWT session tokens — no password storage ever
- Real-Time: WebSockets (Socket.IO) or Server-Sent Events — new mail push, AI job status updates
- Hosting: Frontend on Vercel/Netlify, Backend on Render/Railway/Fly.io — environment-based secrets
- Monitoring: Sentry (errors) + basic request logging — production observability

===================================================
3. AUTHENTICATION
===================================================
Flow: Google OAuth 2.0 Authorization Code flow (server-side exchange, not implicit).

1. Frontend redirects to Google's OAuth consent screen with required scopes:
   - https://www.googleapis.com/auth/gmail.readonly
   - https://www.googleapis.com/auth/gmail.send
   - https://www.googleapis.com/auth/gmail.modify
   - openid email profile
2. Google redirects back to backend /api/auth/google/callback with an authorization code.
3. Backend exchanges the code for access_token + refresh_token, encrypts and stores them server-side (never sent to frontend).
4. Backend issues its own short-lived JWT (session token) to the frontend, stored in an HTTP-only, secure cookie.
5. Refresh tokens are used server-side by a background job to silently renew access tokens before expiry.

Rules:
- Passwords are never requested or stored.
- Access/refresh tokens are encrypted at rest (AES-256) and never exposed in API responses or logs.
- All authenticated routes validate the JWT session and check token expiry server-side.
- CSRF protection via a "state" parameter in the OAuth flow.

===================================================
4. WORKFLOWS & AGENTIC ORCHESTRATION
===================================================
The app models AI-assisted email handling as discrete, chainable workflows rather than one-off prompt calls — this makes the AI layer auditable, reusable, and extensible for bonus features.

Core workflows:
- SummarizeEmail(threadId) -> condensed summary + key points
- GenerateReply(threadId, tone, instructions?) -> draft reply text
- ExplainEmail(threadId) -> plain-language explanation of intent/context
- ClassifyEmail(emailId) -> category + priority label (bonus)
- ExtractActionItems(threadId) -> list of tasks + due dates (bonus)

Agentic orchestration pattern:
An orchestration layer (a lightweight internal "agent controller") sequences multi-step AI tasks so the user can trigger compound actions in one click. Example — "Summarize + Draft Reply":
  fetch thread -> build context window -> summarize (AI call 1)
  -> use summary as context -> generate reply (AI call 2)
  -> return {summary, draft} to frontend

Each step is logged as an execution (see Execution Engine section) with status (queued, running, succeeded, failed), input, output, and duration — so orchestration is inspectable and retryable rather than a black box.

===================================================
5. THIRD-PARTY INTEGRATIONS
===================================================
- Google Gmail API — read, search, send, modify emails — Core
- Anthropic Claude API / OpenAI API — summarization, reply generation, classification — Core
- Google Calendar API — turn extracted dates/deadlines into events — Bonus
- Microsoft Graph API (Outlook) — second email provider — Bonus
- SendGrid/Postmark (optional) — transactional notification emails from the app itself — Optional
- Speech-to-Text API — voice-to-email composition — Bonus

All third-party credentials are stored as environment variables and injected server-side only.

===================================================
6. EXECUTION ENGINE
===================================================
Every AI action (summarize, generate reply, classify, etc.) is treated as an execution job, not a synchronous blocking call, so the UI stays responsive on long threads.

- Job submitted to a Redis-backed queue (BullMQ) with a unique executionId.
- Worker process picks up the job, calls the AI provider, and writes the result to the executions table.
- Frontend either polls /api/executions/:id or subscribes over WebSocket for status/result push.
- Failures are retried with exponential backoff (max 3 attempts) and surfaced to the user with a retry button.
- Rate limiting and token-usage tracking per user to prevent runaway AI costs.

===================================================
7. AI WORKFLOW GENERATION
===================================================
Rather than hardcoding every prompt, the backend maintains a small library of prompt templates per workflow type, parameterized at runtime:

- summarize.prompt — takes thread text, max length, desired format (bullets vs paragraph)
- reply.prompt — takes thread text, selected tone (Professional / Friendly / Formal / Concise), optional user instructions
- classify.prompt — takes email metadata + body, returns structured JSON (category, priority, spam score)
- extract_actions.prompt — returns structured JSON list of {task, dueDate, confidence}

Structured outputs (classification, action items, dates) request JSON-only responses from the AI so they can be parsed and rendered as UI components rather than raw text.

===================================================
8. REAL-TIME LAYER
===================================================
- WebSocket channel per user (Socket.IO) for:
  - Execution status updates (execution:queued, execution:completed, execution:failed)
  - New-email push notifications (via Gmail push notifications / Pub-Sub watch, or polling fallback)
- Gmail push notifications (optional, production-grade): Gmail API watch() + Google Cloud Pub/Sub topic -> backend webhook -> WebSocket broadcast to the relevant user.
- Fallback: periodic polling (e.g., every 60s) of the Gmail API for environments without Pub/Sub set up.

===================================================
9. FRONTEND PAGES
===================================================
- /login — Google OAuth entry point
- /dashboard — Inbox list, folders, search bar, unread counts
- /thread/:id — Full thread view, AI summary panel, reply composer
- /compose — New email composition with AI assist (subject suggestions, tone selector)
- /settings — Connected account management, notification preferences, disconnect Gmail
- /activity — Email history / AI activity log (executions, past summaries/replies)
- /analytics (bonus) — Daily summary digest, inbox stats

===================================================
10. BACKEND ARCHITECTURE & DATABASE COLLECTIONS
===================================================
Architecture: Layered REST API — routes -> controllers -> services -> repositories (Prisma). AI and Gmail logic isolated into dedicated service modules (GmailService, AIService, OrchestrationService) so providers can be swapped without touching route logic.

Database Collections / Tables:
- users: id, email, name, avatarUrl, createdAt
- oauth_tokens: id, userId, provider, encryptedAccessToken, encryptedRefreshToken, expiresAt
- email_cache: id, userId, gmailMessageId, threadId, subject, snippet, from, to, labels, isRead, isStarred, receivedAt
- executions: id, userId, workflowType, status, inputRef, outputRef, error, startedAt, completedAt
- ai_drafts: id, userId, threadId, tone, content, createdFromExecutionId, createdAt
- activity_log: id, userId, action, targetId, metadata, createdAt
- notifications: id, userId, type, payload, read, createdAt
- user_settings: userId, defaultTone, notificationPrefs, connectedProviders

===================================================
11. API ENDPOINTS
===================================================
Health & Auth:
- GET  /api/health
- GET  /api/auth/google              -> redirect to Google consent screen
- GET  /api/auth/google/callback     -> OAuth code exchange
- POST /api/auth/logout
- GET  /api/auth/session             -> current user/session check

Workflows:
- POST /api/workflows/summarize       { threadId }
- POST /api/workflows/generate-reply  { threadId, tone, instructions? }
- POST /api/workflows/explain         { threadId }
- POST /api/workflows/classify        { emailId }
- POST /api/workflows/extract-actions { threadId }

Executions:
- GET  /api/executions/:id            -> status + result
- GET  /api/executions?userId=        -> history list
- POST /api/executions/:id/retry

Emails (Gmail-backed):
- GET    /api/emails                  -> inbox list (paginated, filterable)
- GET    /api/emails/:id              -> single email/thread
- GET    /api/emails/search?q=
- PATCH  /api/emails/:id/read
- PATCH  /api/emails/:id/star
- PATCH  /api/emails/:id/archive
- DELETE /api/emails/:id
- POST   /api/emails/send             { to, subject, body, threadId? }

Integrations & Notifications:
- GET   /api/integrations              -> connected providers status
- POST  /api/integrations/disconnect   { provider }
- GET   /api/notifications
- PATCH /api/notifications/:id/read
- WS    /ws/updates                    -> execution + new-mail events

===================================================
12. FOLDER STRUCTURE & DEVELOPMENT PHASES
===================================================
Folder Structure:
email-assistant/
  frontend/
    src/
      pages/
      components/
      hooks/
      lib/ (api client, websocket client)
      store/
    .env (VITE_API_URL, etc.)
  backend/
    src/
      routes/
      controllers/
      services/ (gmail, ai, orchestration)
      workers/ (queue processors)
      prisma/ (schema.prisma, migrations)
      middleware/ (auth, rateLimit, errorHandler)
    .env (DB_URL, GOOGLE_CLIENT_ID/SECRET, AI_API_KEY, JWT_SECRET, REDIS_URL)
  README.md

Development Phases:
1. Phase 1 - Foundations: Repo scaffolding, DB schema, OAuth flow end-to-end, session auth.
2. Phase 2 - Core Inbox: Gmail fetch, dashboard UI, thread view, read/star/archive/delete, search.
3. Phase 3 - AI Core: Summarization + reply generation workflows, execution engine, reply editing UI, send flow.
4. Phase 4 - Real-Time & Polish: WebSocket updates, activity log, notifications, error/retry handling.
5. Phase 5 - Bonus Features: Classification, priority detection, action-item extraction, tone selector polish, analytics.
6. Phase 6 - Deployment & Hardening: Env-based config, security review, deploy frontend/backend, smoke tests.

===================================================
13. UI GUIDELINES
===================================================
- Clean, inbox-first layout (three-pane: folders/labels -> thread list -> reading pane) on desktop; collapsible single-pane on mobile.
- AI summary appears as a distinct, visually separated panel above the raw email body — never replaces the original content.
- AI-generated reply drafts are clearly labeled "AI Draft" and always editable before sending; no auto-send.
- Loading and job status (queued/running/failed) shown inline, not as blocking modals.
- Tone selector as a simple pill/segmented control (Professional / Friendly / Formal / Concise).
- Empty, loading, and error states designed for every list/detail view.

===================================================
14. SECURITY
===================================================
- OAuth-only authentication; no password fields anywhere in the app.
- Access/refresh tokens encrypted at rest; never returned in API responses or exposed to frontend JS.
- HTTP-only, secure, SameSite cookies for session JWTs.
- All secrets (Google client secret, AI API keys, DB credentials, JWT secret) in environment variables — never committed to source control (.gitignore for .env).
- Input validation and sanitization on every endpoint (e.g., Zod/Joi schemas).
- Rate limiting on AI endpoints per user to prevent abuse/cost overrun.
- CORS locked to the deployed frontend origin.
- Principle of least privilege on Gmail OAuth scopes — request only what's needed.
- Audit trail via activity_log for sensitive actions (send, delete, disconnect).

===================================================
15. OUTCOME
===================================================
A working, deployed web application where a real Gmail user can log in via OAuth, browse and search their live inbox, and use AI to summarize long threads and draft context-aware replies in a selectable tone — with full manual review before anything is sent. The architecture supports incremental extension into classification, prioritization, action-item extraction, and multi-provider (Outlook) support without restructuring the core.

===================================================
16. CODEX / AI CODING AGENT INSTRUCTIONS
===================================================
When implementing this project with an AI coding assistant (Claude Code, Codex, etc.), follow this build order and these constraints:

1. Scaffold first, feature second. Set up the monorepo/folder structure, environment variable templates (.env.example), and Prisma schema before writing any feature logic.
2. Never hardcode secrets. Every credential (Google client ID/secret, AI API key, JWT secret, DB URL, Redis URL) must be read from process.env and documented in .env.example with placeholder values only.
3. Build OAuth end-to-end before anything else. Do not stub authentication — implement the real Google OAuth code-exchange flow and verify a session cookie is issued before moving to inbox features.
4. Isolate provider logic. All Gmail API calls live in GmailService; all AI calls live in AIService. Route/controller code must never call googleapis or the AI SDK directly.
5. Treat AI calls as async jobs, not inline request/response — implement the execution queue (even a simple in-memory version early on) before wiring the frontend to poll/subscribe.
6. Write Prisma migrations incrementally as each table is introduced; don't generate the full schema speculatively before the feature that needs it exists.
7. Always return structured JSON from AI classification/extraction prompts and validate/parse it server-side before storing — never pass raw AI text to the frontend for these features.
8. Add rate limiting and error handling to every AI-calling endpoint as it's built, not retrofitted at the end.
9. Test the send flow last and carefully — sending real email via the Gmail API should require an explicit confirmation step in the UI and should be the final integration point verified before deployment.
10. Keep commits scoped to one phase/feature at a time, matching the development phases above, so the app is runnable and demoable at the end of each phase.

===================================================
17. FINAL EXPECTED OUTCOME
===================================================
By project completion, the deliverable is a deployed, publicly accessible application where:

- A real user can securely connect their Gmail account via OAuth (no passwords ever handled).
- The dashboard shows a live, searchable inbox with standard management actions (read/unread, star, archive, delete).
- Opening a thread offers one-click AI summarization and one-click AI reply generation in a selectable tone.
- All AI-generated replies are editable before sending, and sending goes through the real Gmail API.
- An activity/history view shows past AI actions and email interactions.
- The system is secure (encrypted tokens, env-based secrets, no client-side exposure of credentials) and resilient (async job handling, retries, real-time status updates).
- At least one bonus feature (e.g., classification, priority detection, or action-item extraction) is implemented to demonstrate extensibility of the workflow/orchestration model.
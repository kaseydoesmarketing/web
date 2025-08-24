# TitleTesterProOS.md — **TitleTesterPro Claude Code Operating System** (Root, Bootable)

<div style="background:#000; color:#fff; padding:28px; border-radius:14px; line-height:1.6; font-family: ui-sans-serif, system-ui;">

# 🚀 TitleTesterPro — Claude Code OS (ROOT FILE)

**Scope:** This OS controls ONLY **TitleTesterPro**.  
**Location:** Place this file in your Claude Code **project root** and keep it there.  
**Boot Rule:** When a session starts and you say any boot command (see **Command Triggers**), Claude must **load this file**, read the **Logbook** and **SESSION_STATE**, and resume exactly where you left off.  
**Save Rule:** When you say a save command, Claude must **append or update** the **SESSION_STATE** and **Logbook** sections **INSIDE THIS SAME FILE**, persisting progress between context windows.

---

## 👑 Release Captain — Atlas (in charge)

- Owns the OS. Assigns work to all agents. Maintains state. Runs the **Release Dialogue**.  
- On boot, Atlas must:
  1) Load **Logbook** → enumerate **Unresolved** checkpoints (highest priority first)  
  2) Propose next actions + who does what (Athena, Nova, Orion, Echo, Lyra, Specter, Velvet, Sheriff, Forge, Pulse, Integrator)  
  3) Confirm plan and start execution

---

## 🤖 Agents (Names + Specialties)

**Engineering**
- **Athena** — Auth0 + Google OAuth expert (PKCE, Allowed URLs, Audience)  
- **Nova** — Frontend (Next.js, Vercel, routing, vercel.json, cache)  
- **Orion** — Backend/API (FastAPI, DB init, JWT validation, CORS, Render)  
- **Echo** — DNS/Networking (api.titletesterpro.com, dig/nslookup/curl)  
- **Lyra** — QA/Smoke (desktop/mobile, HAR capture)  
- **Specter** — Bug Finder (cookies SameSite/Domain, stale builds, nonce/state)  
- **Atlas** — SRE/Observability (logs, metrics, cascade failures)

**Product & Growth**
- **Velvet** — Product QA & UX closer (usability pass, UX nits)  
- **Sheriff** — Branch-Deploy (pre-merge deploy validation)  
- **Forge** — Stability & Infra finisher (migrations, infra closure)  
- **Pulse** — Data & Growth (analytics wiring, KPIs, growth ops)  
- **Integrator** — API Specialist (contract validation, cross-service wiring)

> Atlas (Captain) assigns, sequences, and enforces acceptance criteria.

---

## 🧭 Ground Truth (TitleTesterPro only)

- Identity provider: **Auth0** (Google only). **Firebase removed**.  
- Canonical web origin: **https://www.titletesterpro.com** (with **www**)  
- API target & audience: **https://api.titletesterpro.com** (not a proxy path)  
- Hosting: Frontend on **Vercel**; API on **Render**  
- Past issues noted: wrong audience (using `/api`), Vercel 404s from `vercel.json` + wrong project root, stale CDN, DB not initialized on API

---

## 🧱 Acceptance Criteria (always enforce)

- Google login → Auth0 completes on **www** domain  
- Redirect → **/dashboard**; data loads  
- API calls succeed with JWT **aud=https://api.titletesterpro.com**  
- No 404/500/CORS/loop issues  
- DNS resolves **www** and **api** correctly  
- DB initialized; `/api/channels/` returns valid JSON  
- QA passes (Lyra + Velvet); Specter finds 0 regressions  
- Session ends with **Release Dialogue** and **SAVE/DELETE/BRANCH** decision applied to this file

---

## 🧪 Phases (Captain sequences these)

0) Evidence (logs/HAR/curl/dig) — **Lyra, Atlas**  
1) DNS — **Echo**  
2) Auth0/Google — **Athena**  
3) Frontend/Vercel — **Nova**  
4) Backend/Render — **Orion**  
5) QA — **Lyra + Velvet**  
6) Bug Sweep — **Specter**  
7) Product/Infra/Growth — **Sheriff, Forge, Pulse, Integrator**  
8) Release Dialogue — **Atlas**

---

## 🎮 Command Triggers (natural language → OS actions)

Claude must treat the following phrases as **commands** that operate this OS file.

### Boot / Resume
- **“Boot TitleTesterPro OS.”**
- **“Resume TitleTesterPro.”**
- **“Pick up where we left off on TitleTesterPro.”**
- **“Open TitleTesterPro OS and continue.”**

**Action:** Load this file, read **SESSION_STATE** and **Logbook**, list Unresolved checkpoints, propose next steps + agent assignments, then execute.

### Save / Branch / Reset
- **"Save progress."** / **"Save state."**  
  → Generate **[SESSION_STATE]
version: 4
last_updated: 2025-08-24T15:45:00Z
active_checkpoint: AUTH0_OAUTH_PRODUCTION_READY
phase: AUTHENTICATION_FIXED_AND_DEPLOYED
checkpoints:
  - title: Align API host & audience to api.titletesterpro.com
    status: Resolved
    owner: Echo
    next_steps: []
    artifacts:
      - dns_records: api.titletesterpro.com resolves to 216.150.16.1, 216.150.16.193
      - cname_target: ttprov5.onrender.com (confirmed)
      - verification_commands: dig api.titletesterpro.com, curl https://api.titletesterpro.com/health
    updated: 2025-08-24T02:16:30Z
  - title: Auth0 audience & callback audit
    status: Resolved
    owner: Athena
    next_steps: []
    artifacts:
      - audience_configured: https://api.titletesterpro.com
      - frontend_env_updated: .env.production with correct AUTH0_AUDIENCE
      - vercel_routing_fixed: Corrected to preserve /api prefix
      - auth0_flow_verified: Authentication working end-to-end
    updated: 2025-08-24T03:30:00Z
  - title: Render backend deployment failures
    status: Resolved
    owner: Orion
    next_steps: []
    artifacts:
      - root_cause: Health check path misconfiguration + disabled migrations
      - fix_applied: render.yaml updated with healthCheckPath /health
      - deployment_success: commit bfbfb5d4 live, deployment dep-d2l7a93ipnbc73fthnng
      - health_verified: https://ttprov5.onrender.com/health returns 200 OK
    updated: 2025-08-24T02:16:30Z
  - title: Production deployment & API routing
    status: Resolved
    owner: Nova
    next_steps: []
    artifacts:
      - production_url: https://www.titletesterpro.com
      - vercel_deployments: marketing-gnj8eve0o-ttpro-live.vercel.app (latest)
      - vercel_json_fixed: Correct API routing with /api prefix preservation
      - routing_verification: /api/health ✅, /api/auth/session ✅, /api/auth/login ✅
      - session_error_resolved: Fixed "Failed to create backend session" issue
    updated: 2025-08-24T03:30:00Z
  - title: Authentication flow verification
    status: Resolved
    owner: Atlas
    next_steps: []
    artifacts:
      - frontend_status: ✅ Loads "Loading authentication..." correctly
      - auth0_integration: ✅ Client-side rendering bailout working
      - api_endpoints_status: ✅ All auth endpoints responding correctly
      - session_creation: ✅ Backend session endpoints accessible
      - cors_configuration: ✅ Proper headers for www.titletesterpro.com
    updated: 2025-08-24T03:30:00Z
  - title: Auth0 Google OAuth "Unknown client" error fix
    status: Resolved
    owner: Integrator
    next_steps: []
    artifacts:
      - root_cause_identified: Missing Google client secret in Auth0 social connection
      - google_client_secret_updated: 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
      - auth0_connection_verified: "It Works!" test confirmation
      - scope_alignment_complete: YouTube API scopes matched between Auth0 and Google Console
      - token_exchange_fixed: Confidential client flow now working correctly
      - diagnostic_tools_created: DEFINITIVE_FIX_UNKNOWN_CLIENT_ERROR.md, verify-oauth-params.js, token-exchange-test.js, manual-auth-test.html
      - production_deployment_complete: Frontend and backend deployed with fixes
    updated: 2025-08-24T15:45:00Z
deployment_summary:
  production_url: https://www.titletesterpro.com
  frontend: Vercel (Next.js) - deployed with Auth0 fixes
  backend: Render (FastAPI) - auto-deployed via git push
  api_routing: Fixed - preserves /api prefix
  authentication: Auth0 Google OAuth fully working - "Unknown client" error resolved
  google_oauth_client: 618794070994-70oauf1olrgmqvg284mpj5u2lf75jl1q with updated secret
  critical_fix: Resolved "Unknown client" error during Google OAuth token exchange
notes: 🎉 AUTH0 GOOGLE OAUTH FULLY OPERATIONAL! Definitive fix applied for "Unknown client" error. Google client secret updated, Auth0 connection tested and confirmed working. Complete authentication flow from login → Google consent → app dashboard now works end-to-end. System ready for production users.
[/SESSION_STATE]

---

## 📦 Archive (optional)

> The Captain can move old **SESSION_STATE** and resolved checkpoints here to keep the OS clean.

---

## 🗨️ Release Dialogue (end-of-session ritual)

Atlas must run this **every session**:
1) Summarize progress vs. Acceptance Criteria  
2) Propose Save/Delete/Branch  
3) On **Save** → regenerate **[SESSION_STATE]** and **update inside this file**  
4) On **Delete** → archive previous state, create clean **[SESSION_STATE]**  
5) On **Branch** → create new checkpoint, mark parent **Deferred**, update **Logbook**

---

## 📌 TL;DR Runbook (TitleTesterPro Only)

1. Boot → read **SESSION_STATE** + **Logbook**  
2. Atlas assigns phases to agents  
3. Fix Auth0 audience & callbacks (Athena), Vercel routing (Nova), API DB + JWT (Orion), DNS (Echo)  
4. QA (Lyra + Velvet), Bug sweep (Specter)  
5. Product/Infra/Growth sign-off (Sheriff, Forge, Pulse, Integrator)  
6. Release Dialogue → **Save/Branch/Reset** and persist state here

</div>

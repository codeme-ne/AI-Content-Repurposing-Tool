# Social Transformer – Projektdokumentation

> Bewerbungsrelevante Dokumentation | Lukas Zangerl | Automations- & KI-Experte

---

## Projektname & Repository

**Social Transformer** (`AI-Content-Repurposing-Tool`)  
🔗 Live: https://linkedin-posts-one.vercel.app *(aktuelles Deployment)*  
🔗 Repo: https://github.com/codeme-ne/AI-Content-Repurposing-Tool

---

## Kurzbeschreibung

KI-gestützte Web-App zur automatischen Transformation von Newsletter-Texten und Artikeln in plattformoptimierte Social-Media-Posts für **LinkedIn**, **X (Twitter)** und **Instagram** – in einem einzigen Arbeitsschritt, mit konsistenter Stimme und konfigurierbarem Ton.

**Kernmehrwert:** Ein Eingabetext → drei fertige, plattformgerechte Posts in unter 60 Sekunden – ohne manuelles Umschreiben.

---

## Verwendeter Stack

| Schicht | Technologie | Zweck |
|---------|-------------|-------|
| **Frontend** | React 19, TypeScript 5.9, Vite 7 | Moderne SPA mit strikter Typsicherheit |
| **Styling** | TailwindCSS 3.4, shadcn/ui, Radix UI | Zugängliche, composable Komponenten |
| **KI-Integration** | OpenRouter API (LLM-Proxy) | Modell-agnostische KI-Anbindung |
| **Backend** | Vercel Edge Functions (TypeScript) | Serverlose API-Endpunkte, global verteilt |
| **Datenbank & Auth** | Appwrite Cloud (Frankfurt) | Authentifizierung, Datenpersistenz, Permissions |
| **Zahlungen** | Stripe (Checkout, Webhooks, Portal) | Freemium-Modell mit monatlichen/jährlichen Plänen |
| **URL-Extraktion** | Jina Reader API | Webseiten-Inhalte sauber extrahieren |
| **Animationen** | Framer Motion 12 | Flüssige UI-Übergänge |
| **Testing** | Vitest 2 + Testing Library, Playwright | Unit-, Integrations- & E2E-Tests |
| **CI/CD** | GitHub Actions, Vercel | Automatisierte Builds, Tests & Deployments |
| **Monitoring** | OpenTelemetry | Distributed Tracing für Edge Functions |

---

## Projektziele

### Fachlich
1. **Zeitersparnis im Content-Marketing**: Mehrfaches manuelles Umschreiben desselben Inhalts für verschiedene Plattformen eliminieren.
2. **Konsistenz der Markenstimme**: Tonalität und Stil systemweit konfigurierbar halten, statt pro Post manuell anzupassen.
3. **Skalierbarkeit**: Gleiche Infrastruktur für 1 bis 10.000 Nutzer – keine Kapazitätsplanung nötig.

### Technisch
4. **KI-Kosten minimieren**: Batch-Verarbeitung reduziert API-Aufrufe um ~67 % gegenüber parallelen Einzelanfragen.
5. **Zero-Server-Overhead**: Komplett serverlose Architektur (Vercel Edge + Appwrite Cloud).
6. **Sichere API-Key-Verwaltung**: OpenRouter-Key nie im Client, immer serverseitig in Edge Functions.
7. **Freemium-Monetarisierung**: Free-Tier mit localStorage-Counter + Premium via Stripe, ohne Datenbank-Overhead für anonyme Nutzer.

---

## Umsetzung

### Architektur-Überblick

```
Nutzer-Input
    │
    ├─ [Optional] URL → Edge Function /api/extract → Jina Reader → bereinigter Text
    │
    ▼
React-Frontend (useContentGeneration-Hook)
    │
    ├─ Prompt-Builder (promptBuilder.ts) — XML-strukturierte Prompts mit Plattform-Constraints
    │
    ▼
Edge Function /api/openrouter/v1/chat
    │  (OpenRouter-API-Key serverseitig injiziert)
    ▼
OpenRouter → LLM (z. B. GPT-4o, Claude 3.5 Sonnet, …)
    │
    ▼
Geparste Antwort → Plattform-Posts (LinkedIn / X / Instagram)
    │
    ├─ Anzeige im UI mit Copy/Share-Buttons
    └─ Optional: Speichern in Appwrite (Dokumenten-Permissions pro User)
```

### Kernkomponenten & Designentscheidungen

#### 1. Batched AI Processing
Statt N paralleler API-Calls für N Plattformen werden alle Plattformen in **einem einzigen Prompt** generiert – durch XML-Marker (`<linkedin_post>`, `<x_post>`, `<instagram_post>`) in der Antwort. Fallback auf parallele Einzelcalls bei Fehler.

```
Ergebnis: ~67 % weniger API-Kosten, ~40 % schnellere Gesamtgenerierung
```

#### 2. Prompt Engineering (promptBuilder.ts)
- Plattformspezifische Constraints: Zeichenlimits (X: 280), Hashtag-Regeln, Ton-Anweisungen
- Konfigurierbare Voice-Tones (Professional, Casual, Inspirational, …)
- Temperatur-Skalierung: Basis variiert per Plattform (0.65 X, 0.85 Instagram), Regenerierungen steigen progressiv (0.75 → 0.80 → 0.85 …)

#### 3. Subscription & Access Control
```
is_active (Appwrite) = Single Source of Truth für Premium-Status
useSubscription-Hook: 60s In-Memory-Cache → minimiert Datenbankabfragen
Free Tier: localStorage-Counter (usage_YYYY-MM-DD) ≤ 3/Tag ohne Backend-Hit
```

#### 4. Auth Flow (Magic Link + JWT)
```
Client → Appwrite Magic Link E-Mail → Callback URL → account.createJWT()
→ Bearer Token in Header → Edge Function verifyJWT() → Stripe-/DB-Operationen
```

#### 5. Webhook-Sicherheit (Stripe)
Idempotenz-Tabelle (`processed_webhooks`) in Appwrite verhindert Doppelverarbeitung. Anomalie-Logging in `webhook_anomalies`.

#### 6. SSRF-Schutz in /api/extract
URL-Validierung blockt private IP-Ranges (10.x, 192.168.x, 127.x, 169.254.x) bevor Jina Reader aufgerufen wird.

---

## Vorher / Nachher – Ergebnisse

### Content-Marketing-Workflow

| Schritt | Vorher (manuell) | Nachher (Social Transformer) |
|--------|-----------------|------------------------------|
| Input vorbereiten | Text kopieren, für jede Plattform öffnen | Einmal einfügen oder URL eingeben |
| Pro Post schreiben | 10–20 Min. × 3 Plattformen = 30–60 Min. | ~30 Sek. Generierungszeit |
| Ton anpassen | Manuell pro Post | 1 Klick (Tone-Preset) |
| Speichern/Archivieren | Copy-Paste in Dokument | 1-Klick-Speichern mit User-Permissions |
| **Gesamtzeit** | **30–60 Minuten** | **< 2 Minuten** |

### Technische KPIs

| Metrik | Ausgangszustand | Nach Optimierung |
|--------|----------------|-----------------|
| API-Calls pro Generierung | 3 (parallel) | 1 (batched) |
| Geschätzte KI-Kosten | Baseline | −67 % |
| Seiten-Ladezeit (Lighthouse) | – | < 1.5 s (Edge CDN) |
| Auth-Latenz | Serverbasiert | < 200 ms (Edge + JWT) |
| Test-Abdeckung | 0 Tests | 29 Unit-/Integrations-Tests |

---

## Herausforderungen & Lösungen

| Herausforderung | Lösung |
|----------------|--------|
| OpenRouter-API-Key im Client würde exponiert | Proxy-Edge-Function als sicherer Mittelsmann |
| Stripe-Webhooks können mehrfach ankommen | Idempotenz-Tabelle in Appwrite |
| Magic-Link-Auth verliert Session nach Redirect | `reconcile-subscription.ts` synct Status nach Login |
| SSRF-Risiko bei URL-Extraktion | IP-Range-Validierung vor externem HTTP-Call |
| Hohe KI-Kosten bei Multi-Plattform-Output | Batching aller Plattformen in einem einzigen Prompt |
| Mobile UX für komplexe Generator-UI | Bottom-Sheet-Navigation + UnifiedLayout-Wrapper |

---

## Relevanz für Automation & KI

- **LLM-Integration**: Praxiserfahrung mit OpenRouter-Proxy, Prompt Engineering, Temperatur-Tuning und Modell-Fallback-Strategien.
- **Workflow-Automatisierung**: Vollständige Automatisierung eines mehrschrittigen Content-Workflows (Extraktion → Transformation → Verteilung).
- **Edge Computing**: Serverlose, global verteilte API-Schicht mit minimaler Latenz.
- **Freemium-Automatisierung**: Automatische Subscription-Verwaltung über Stripe-Webhooks ohne manuellen Eingriff.
- **Observability**: OpenTelemetry-Tracing für alle Edge Functions – produktionsreife Monitoring-Basis.

---

## Projektdaten

| | |
|-|-|
| **Zeitraum** | 2025–2026 |
| **Typ** | Solo-Projekt (Fullstack) |
| **Codebase** | 93 TypeScript/TSX-Dateien, ~15.500 LOC |
| **Tests** | 29 automatisierte Tests (Vitest + Playwright) |
| **Deployment** | Vercel (Edge Functions + CDN) |
| **Datenbank** | Appwrite Cloud Frankfurt (DSGVO-konform) |
| **Lizenz** | MIT |

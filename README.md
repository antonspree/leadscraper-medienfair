# SHK Lead Scraper

Web-App zum Sammeln und Qualifizieren von SHK-Leads (Sanitär, Heizung, Klima) über öffentliche Verzeichnisse, mit Impressum-Extraktion per Claude Haiku. Stack: **Next.js 14 (App Router)**, **TypeScript**, **Tailwind + shadcn/ui**, **Supabase**, **Vercel Cron**, **Anthropic**.

## Deployment-Checkliste

1. **Supabase**: Projekt anlegen, im SQL-Editor die Datei [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql) ausführen (Kern-Tabellen + `discovery_state`).
2. **GitHub**: Repository anlegen und diesen Code pushen.
3. **Vercel**: Neues Projekt mit GitHub verbinden, Root-Verzeichnis wählen, **Environment Variables** setzen (siehe `.env.example`).
4. **Erster Discovery-Lauf**: Nach dem Deploy manuell auslösen (mit Secret):

   ```bash
   curl -H "Authorization: Bearer <CRON_SECRET>" "https://<dein-projekt>.vercel.app/api/cron/discovery"
   ```

5. **Cron**: Vercel führt die Jobs gemäß [`vercel.json`](vercel.json) aus — nach einiger Zeit sollten Queue und Leads im Dashboard sichtbar sein.

## Durchsatz erhöhen (mehr Leads pro Zeit)

Standard ist schon erhöht: **Scrape-Batch 15**, Cron **alle 2 Minuten** (aktive Zeitfenster), **Discovery bis zu 2500** neue URLs pro Lauf.

In **Vercel → Environment Variables** optional setzen:

| Variable | Wirkung |
| --- | --- |
| `QUALITY_MIN_ISSUES=1` | Lockere Qualifikation (1 Mangel reicht statt 2) — deutlich mehr Kandidaten, weniger „schlechte Website“-Fokus. |
| `SCRAPE_BATCH_SIZE` | Parallel pro Batch (Standard **15**, max. 30). |
| `SCRAPE_MAX_RUNTIME_MS` | Laufzeit pro Scrape-Request (Standard **58000**, max. **58000** bei Hobby wegen 60 s Function-Limit). |
| `DISCOVERY_MAX_URLS` | Max. neue Queue-URLs pro Discovery-Lauf (Standard **2500**, max. 10000). |
| `RATE_LIMIT_HOST_MS` | Pause pro Host in ms (Standard **200**, min. 50 — kleiner = schneller, höheres Blockier-Risiko). |

**Kosten:** Mehr Batches → mehr Anthropic-Aufrufe und Vercel-Minuten. **Hobby:** Function-Timeout bleibt 60 s — für längere Läufe Vercel Pro und `maxDuration` in den Cron-`route.ts`-Dateien erhöhen.

## Lokale Entwicklung

```bash
npm install
cp .env.example .env.local
# .env.local mit echten Werten füllen
npm run dev
```

- App: `http://localhost:3000`
- Cron-Routen lokal mit gleichem `Authorization: Bearer`-Header testen.

## Umgebungsvariablen

| Variable | Beschreibung |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon Key (optional für spätere Client-Nutzung) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role — nur Server/Cron, **nie** im Client |
| `ANTHROPIC_API_KEY` | API-Key für Claude Haiku |
| `CRON_SECRET` | Zufälliger String; Vercel Cron und `curl` senden `Authorization: Bearer <CRON_SECRET>` |
| `ADMIN_PASSWORD` | Passwort für **Einstellungen → Jobs auslösen** (Discovery/Scrape per UI, `POST /api/admin/trigger`) |

## Rechtliches / Verantwortung

Die Nutzung öffentlicher Verzeichnisse kann gegen Nutzungsbedingungen verstoßen. Nutzung auf **eigenes Risiko**; rechtliche Prüfung wird empfohlen. Die App hat **kein Login** — die URL ist nur ein schwacher Schutz; interne Nutzung oder zusätzliche Absicherung empfohlen.

## Kostenschätzung (ca.)

| Komponente | Kosten/Monat |
| --- | --- |
| Vercel (Hobby) | 0 € |
| Supabase (Free Tier) | 0 € |
| Anthropic Haiku | ~3–5 € (bei ca. 5.000 Leads) |
| Discovery (Verzeichnisse) | 0 € |
| **Gesamt** | **~3–5 €/Monat** |

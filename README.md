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
| `CRON_SECRET` | Zufälliger String; Vercel Cron und manuelle Aufrufe senden `Authorization: Bearer <CRON_SECRET>` |

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

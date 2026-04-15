import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminTriggers } from "@/components/settings/AdminTriggers";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Einstellungen</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Konfiguration und manuelle Jobs
        </p>
      </div>

      <AdminTriggers />

      <Card className="rounded-[12px] border-white/10 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">Umgebungsvariablen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-zinc-400">
          <p>
            In Vercel unter <strong className="text-zinc-200">Project Settings → Environment Variables</strong>{" "}
            setzen: <code className="text-[#22c55e]">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
            <code className="text-[#22c55e]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>,{" "}
            <code className="text-[#22c55e]">SUPABASE_SERVICE_ROLE_KEY</code>,{" "}
            <code className="text-[#22c55e]">ANTHROPIC_API_KEY</code>,{" "}
            <code className="text-[#22c55e]">CRON_SECRET</code>,{" "}
            <code className="text-[#22c55e]">ADMIN_PASSWORD</code> (Passwort für „Jobs auslösen“ in dieser App).
          </p>
          <p>
            Lokale Entwicklung: <code className="rounded bg-zinc-950 px-1">.env.local</code> anlegen (siehe{" "}
            <code className="rounded bg-zinc-950 px-1">.env.example</code>).
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-[12px] border-white/10 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">Manuelle Cron-Aufrufe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-400">
          <p>
            Discovery und Scrape sind mit <code className="text-zinc-200">Authorization: Bearer CRON_SECRET</code>{" "}
            geschützt. Beispiel:
          </p>
          <pre className="overflow-x-auto rounded-[12px] bg-zinc-950 p-4 font-mono text-xs text-zinc-300">
            {`curl -H "Authorization: Bearer $CRON_SECRET" \\
  "https://<dein-projekt>.vercel.app/api/cron/discovery"`}
          </pre>
          <p className="text-zinc-500">
            Ersetze <code className="text-zinc-300">$CRON_SECRET</code> durch den Wert aus Vercel — nicht committen.
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-[12px] border-white/10 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">Links</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <a
            className="text-[#3b82f6] hover:underline"
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
          >
            Supabase Dashboard
          </a>
          <a
            className="text-[#3b82f6] hover:underline"
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noreferrer"
          >
            Vercel Dashboard
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

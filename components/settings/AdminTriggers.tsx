"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminTriggers() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<"discovery" | "scrape" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/trigger")
      .then((r) => r.json())
      .then((d: { triggerConfigured?: boolean }) =>
        setConfigured(d.triggerConfigured ?? false)
      )
      .catch(() => setConfigured(false));
  }, []);

  async function run(action: "discovery" | "scrape") {
    setMessage(null);
    setError(null);
    setLoading(action);
    try {
      const res = await fetch("/api/admin/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : `Fehler (${res.status})`
        );
        return;
      }
      setMessage(JSON.stringify(data, null, 2));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(null);
    }
  }

  if (configured === null) {
    return (
      <Card className="rounded-[12px] border-white/10 bg-zinc-900/50">
        <CardContent className="p-6 text-sm text-zinc-500">Laden…</CardContent>
      </Card>
    );
  }

  if (!configured) {
    return (
      <Card className="rounded-[12px] border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="text-base text-amber-200">
            Jobs aus der App
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-zinc-400">
          Setze in Vercel (oder <code className="rounded bg-zinc-950 px-1">.env.local</code>) die Variable{" "}
          <code className="text-[#22c55e]">ADMIN_PASSWORD</code>, deploye neu — dann erscheint hier das
          Passwortfeld und die Buttons.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[12px] border-white/10 bg-zinc-900/50">
      <CardHeader>
        <CardTitle className="text-base text-zinc-200">Jobs auslösen</CardTitle>
        <p className="text-sm font-normal text-zinc-500">
          Discovery (URLs sammeln) und Scrape (Queue verarbeiten) — geschützt mit{" "}
          <code className="text-zinc-400">ADMIN_PASSWORD</code>.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="admin-pw" className="text-zinc-400">
            Passwort
          </Label>
          <Input
            id="admin-pw"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-[12px] border-white/10 bg-zinc-950"
            placeholder="ADMIN_PASSWORD"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={loading !== null || !password}
            className="rounded-[12px] bg-[#3b82f6] text-white hover:bg-[#2563eb]"
            onClick={() => run("discovery")}
          >
            {loading === "discovery" ? "Discovery…" : "Discovery starten"}
          </Button>
          <Button
            type="button"
            disabled={loading !== null || !password}
            className="rounded-[12px] bg-[#22c55e] text-black hover:bg-[#16a34a]"
            onClick={() => run("scrape")}
          >
            {loading === "scrape" ? "Scrape…" : "Scrape starten"}
          </Button>
        </div>
        {error ? (
          <pre className="whitespace-pre-wrap rounded-[12px] border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </pre>
        ) : null}
        {message ? (
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-[12px] border border-white/10 bg-zinc-950 p-3 font-mono text-xs text-zinc-300">
            {message}
          </pre>
        ) : null}
      </CardContent>
    </Card>
  );
}

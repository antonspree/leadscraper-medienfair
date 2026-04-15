import { NextRequest, NextResponse } from "next/server";
import {
  isAdminPasswordConfigured,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { runDiscoveryJob, runScrapeJob } from "@/lib/cron/jobs";

export const maxDuration = 60;

/** GET: nur Status, ob App-Trigger konfiguriert ist (ohne Secret). */
export async function GET() {
  return NextResponse.json({
    triggerConfigured: isAdminPasswordConfigured(),
  });
}

type Body = {
  password?: string;
  action?: "discovery" | "scrape";
};

export async function POST(req: NextRequest) {
  if (!isAdminPasswordConfigured()) {
    return NextResponse.json(
      {
        error:
          "ADMIN_PASSWORD ist nicht gesetzt — App-Trigger in Vercel konfigurieren.",
      },
      { status: 503 }
    );
  }

  let json: Body;
  try {
    json = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Ungültiger JSON-Body" }, { status: 400 });
  }

  const password = typeof json.password === "string" ? json.password : "";
  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const action = json.action;
  if (action !== "discovery" && action !== "scrape") {
    return NextResponse.json(
      { error: 'action muss "discovery" oder "scrape" sein' },
      { status: 400 }
    );
  }

  const result =
    action === "discovery" ? await runDiscoveryJob() : await runScrapeJob();
  return NextResponse.json(result.body, { status: result.status });
}

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export interface ExtractedLead {
  company_name: string | null;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  position: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  branche: string;
}

export async function extractFromImpressum(
  impressumText: string
): Promise<ExtractedLead | null> {
  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Extrahiere Kontaktdaten aus diesem deutschen Impressum-Text.
Antworte NUR mit einem JSON-Objekt, kein Text davor oder danach, keine Markdown-Backticks.

Regeln:
- Telefonnummer: immer Format "0XXX XXXXXXX" (kein +49, mit Leerzeichen nach Vorwahl)
- E-Mail: (at) und [at] wurden bereits zu @ konvertiert
- position: "Geschäftsführer", "Inhaber", "Inhaberin" oder "Geschäftsführerin"
- branche: erkenne die Branche aus dem Text, Standard: "Sanitär-, Heizungs- und Klimatechnik (SHK)"
- Fehlende Felder als null

Impressum:
${impressumText}

Antworte mit:
{"company_name":...,"first_name":...,"last_name":...,"title":...,"email":...,"phone":...,"position":...,"address":...,"city":...,"state":...,"zip":...,"branche":...}`,
        },
      ],
    });

    const block = response.content[0];
    const text = block.type === "text" ? block.text : "";
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned) as ExtractedLead;
  } catch {
    return null;
  }
}

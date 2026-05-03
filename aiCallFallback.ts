// Helper per chiamare Claude (Anthropic) come unico provider AI.
// Sostituisce il vecchio sistema Lovable Gateway + Gemini fallback.
// La chiave ANTHROPIC_API_KEY vive nei secret delle Supabase Edge Functions.
// Interfaccia identica al file precedente → nessun breaking change nelle edge function che lo importano.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export type AiMessage = {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
};

export type AiTool = {
  type: "function";
  function: { name: string; description?: string; parameters: Record<string, unknown> };
};

export type AiCallOptions = {
  messages: AiMessage[];
  task: string;
  mode?: "any-text" | "openai-compat" | "openai-compat+tools";
  json?: boolean;
  tools?: AiTool[];
  tool_choice?: unknown;
  max_tokens?: number;
  temperature?: number;
  timeout_ms?: number;
};

export type AiCallSuccess = {
  ok: true;
  text: string;
  raw: any;
  provider: string;
  providerLabel: string;
  providerName: string;
  model: string;
  switched: boolean;
  fallbackChain: string[];
};

export type AiCallFailure = {
  ok: false;
  error: string;
  fallbackChain: string[];
  lastStatus?: number;
};

const CLAUDE_ENDPOINT = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL    = "claude-sonnet-4-5";
const ANTHROPIC_VER   = "2023-06-01";

// ─── Conversione messaggi OpenAI-style → formato Anthropic ───────────────────
function messagesToAnthropic(messages: AiMessage[]): { system: string; messages: any[] } {
  const systemParts: string[] = [];
  const converted: any[] = [];

  for (const m of messages) {
    if (m.role === "system") {
      if (typeof m.content === "string") {
        systemParts.push(m.content);
      } else {
        for (const c of m.content) {
          if (c.type === "text" && c.text) systemParts.push(c.text);
        }
      }
      continue;
    }

    let content: any;
    if (typeof m.content === "string") {
      content = m.content;
    } else {
      const parts: any[] = [];
      for (const c of m.content) {
        if (c.type === "text" && c.text) {
          parts.push({ type: "text", text: c.text });
        } else if (c.type === "image_url" && c.image_url?.url) {
          const url = c.image_url.url;
          const match = url.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            parts.push({ type: "image", source: { type: "base64", media_type: match[1], data: match[2] } });
          } else {
            parts.push({ type: "image", source: { type: "url", url } });
          }
        }
      }
      // se c'è solo un blocco testo, semplifica a stringa
      content = parts.length === 1 && parts[0].type === "text" ? parts[0].text : parts;
    }

    converted.push({ role: m.role, content });
  }

  return { system: systemParts.join("\n\n"), messages: converted };
}

// ─── Chiamata effettiva a Claude ─────────────────────────────────────────────
async function callClaude(
  opts: AiCallOptions,
  apiKey: string,
): Promise<{ ok: boolean; status: number; raw?: any; text?: string; error?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), opts.timeout_ms ?? 90_000);

  try {
    const { system, messages } = messagesToAnthropic(opts.messages);

    // JSON mode: Claude non ha response_format nativo → inietta istruzione nel system
    const systemPrompt = opts.json
      ? `${system}\n\nRispondi ESCLUSIVAMENTE con JSON valido. Niente markdown, niente backtick, niente testo aggiuntivo prima o dopo.`
      : system;

    const body: Record<string, unknown> = {
      model: CLAUDE_MODEL,
      max_tokens: opts.max_tokens ?? 16384,
      messages,
    };
    if (systemPrompt)               body.system      = systemPrompt;
    if (opts.temperature !== undefined) body.temperature = opts.temperature;
    // opts.tools ignorati (come già faceva Gemini fallback): le edge che ne hanno bisogno
    // vanno migrate separatamente se necessario.

    const res = await fetch(CLAUDE_ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "x-api-key":          apiKey,
        "anthropic-version":  ANTHROPIC_VER,
        "Content-Type":       "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return { ok: false, status: res.status, error: (await res.text()).slice(0, 800) };
    }

    const raw = await res.json();

    // Estrai testo dai content block Anthropic
    const text: string = (raw?.content ?? [])
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text as string)
      .join("");

    // Adatta raw alla shape OpenAI per compatibilità con tutti i chiamanti esistenti
    const adaptedRaw = {
      ...raw,
      choices: [{ message: { role: "assistant", content: text } }],
    };

    return { ok: true, status: 200, raw: adaptedRaw, text };
  } catch (e) {
    const isTimeout = (e as Error).name === "AbortError";
    return { ok: false, status: 0, error: isTimeout ? "timeout" : (e as Error).message };
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Entry point pubblico (stesso nome e firma del file originale) ────────────
export async function callAIWithFallback(
  _admin: SupabaseClient,
  _userId: string,
  opts: AiCallOptions,
): Promise<AiCallSuccess | AiCallFailure> {
  const fallbackChain: string[] = ["claude"];
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");

  if (!apiKey) {
    return {
      ok: false,
      error: "ANTHROPIC_API_KEY non trovata nei secret Supabase. Aggiungila in Project Settings → Edge Functions → Secrets.",
      fallbackChain,
    };
  }

  const r = await callClaude(opts, apiKey);

  if (r.ok) {
    return {
      ok: true,
      text: r.text ?? "",
      raw: r.raw,
      provider:      "claude",
      providerLabel: "CL",
      providerName:  "Claude (Anthropic)",
      model:         CLAUDE_MODEL,
      switched:      false,
      fallbackChain,
    };
  }

  return {
    ok: false,
    error:         `Claude error (status=${r.status}): ${r.error ?? "errore sconosciuto"}`,
    fallbackChain,
    lastStatus:    r.status,
  };
}
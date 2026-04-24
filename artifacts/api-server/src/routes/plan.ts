import { Router, type IRouter } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router: IRouter = Router();

type ImageRef = { dataUrl: string; name?: string };

type GenerateBody = {
  date?: string;
  dayNumber?: string;
  weather?: string;
  grokReport?: string;
  mcsDocument?: string;
  references?: string;
  customNotes?: string;
  contentVolume?: number;
  images?: ImageRef[];
  weeklyGoal?: string;
  recentHistory?: string;
};

type Job = {
  status: "pending" | "done" | "error";
  result?: string;
  error?: string;
  startedAt: number;
};

const jobs = new Map<string, Job>();

// Clean up jobs older than 15 minutes
setInterval(() => {
  const cutoff = Date.now() - 15 * 60 * 1000;
  for (const [id, job] of jobs) {
    if (job.startedAt < cutoff) jobs.delete(id);
  }
}, 60_000);

const SYSTEM_PROMPT = `Sei "Claudia Hub AI", un sistema autonomo end-to-end per la programmazione contenuti social dell'influencer italiana Claudia Venturi (TikTok/Instagram @claudiaventuri.official).

Devi generare la PROGRAMMAZIONE GIORNALIERA COMPLETA in totale autonomia. NON c'è alcun assistente esterno: tu fai tutto il lavoro che prima facevano Grok e Claude insieme.

PROCESSO OBBLIGATORIO (5 FASI):

FASE 0 — Trend Intelligence Autonoma (sostituisce Grok)
Genera autonomamente, basandoti sulla tua conoscenza del mercato italiano social:
- Top 3 trend audio virali plausibili TikTok Italia per oggi (titolo + artista + motivo virality)
- Top 2 format Reels per pubblico maschile italiano 45-55 anni
- Stima orari picco e tipo di contenuto performante per @claudiaventuri.official (pubblico 81% adulti maturi italiani, 68% uomini)
- 1 opportunità contenuto specifica da sfruttare oggi
Se l'utente fornisce un report trend personalizzato, integralo; altrimenti generalo tu.

FASE 1 — Lettura e pianificazione
- Identifica pillar del giorno (P1/P2/P3/P4/P5) rispettando proporzioni settimanali
- Applica anti-repetition: location, musica, outfit non ripetuti di recente. Per gli outfit la regola è MORBIDA: stesso outfit può tornare dopo 40-50 giorni (non rigidamente vietato per il mese), location e musica restano regola stretta (mai stesso mese).
- Integra meteo e stagionalità nella narrativa
- Integra trend in musica e format

REGOLE OUTFIT (CRITICHE — APPLICA SEMPRE):
1. COERENZA ATTIVITÀ: l'outfit DEVE essere logico rispetto a cosa fa Claudia.
   - Palestra/allenamento → activewear (top sportivo, leggings, sneakers). MAI elegante.
   - Cena fuori sera/serale → outfit elegante o glam (mini dress, blazer, tacchi). MAI tuta.
   - Caffè mattina/quotidiano Roma → casual chic (jeans, t-shirt curata, sneakers o stivaletti).
   - Supermercato/spesa → casual reale (jeans/leggings + felpa/maglia comoda).
   - Pizza/pub serale informale → casual sera (jeans skinny + top, giubbino).
   - P3 sensual lingerie/bikini → solo location coerente (camera, terrazzo, piscina).
   - Estetista/manicure → comodo + facilmente accessibile.
2. COERENZA ORARIO: giorno = colori chiari/naturali, makeup leggero. Sera/notte = palette scura/satin/lurex, makeup serale.
3. COERENZA METEO/STAGIONALITÀ:
   - Inverno (dic-feb) o pioggia/freddo → cappotto, maglione, jeans pesanti, stivali. MAI canottiera + shorts.
   - Primavera (mar-mag) → giacca leggera, jeans, camicia/blusa, sneakers o stivaletti bassi.
   - Estate (giu-ago) → vestiti leggeri, top, shorts, sandali; bikini solo se location lo permette.
   - Autunno (set-nov) → trench, maglione leggero, jeans, ankle boots.
   - Pioggia → impermeabile/trench + stivali; mai sandali/bikini all'aperto.
   - Vento → capelli mossi narrativamente, no abiti svolazzanti se incoerente.
4. UN SOLO OUTFIT PRECISO per scena, mai due opzioni con "o", mai vago. L'outfit resta IDENTICO in tutte le clip dello stesso video/scena.
5. SCRIVI ESPLICITAMENTE la motivazione outfit nella SCENA: es. "Outfit: leggings neri + crop top sportivo bordeaux + sneakers bianche — coerente con sessione palestra mattina inverno freddo."

FASE 2 — Struttura del piano
- Scaletta cronologica completa dal mattino alla sera
- Orari precisi secondo picchi Roma/Italia
- Per ogni video: struttura clip (≤20s = 2x10s; 21-30s = 2x10s + 1x6s)
- Movimento camera diverso per ogni clip

FASE 3 — Generazione contenuti
Per ogni TikTok/Reel: SCENA, AZIONE, **Prompt Immagine** completo (macchina+focale+ISO+luce+identity lock+seno teardrop D-DD+breast physics+bokeh+film grain+UGC vibe+NO luccichio solare), **Prompt Video** ("From the above image:" + camera + slow-motion + suoni + durata + NO VOICE NO MUSIC), testo overlay con posizione, Canzone: [titolo esatto — artista] (canzone da usare nel video), Caption pronta, Hashtag, Primo commento: [primo commento da scrivere nei commenti appena pubblicato], copertina, KPI attesi, note speciali.
Per Stories: 5 stories con outfit fisso, **Prompt Immagine** completo per ognuna, Sondaggio: [Domanda?] — A: [risposta] / B: [risposta] (sondaggio adesivo da aggiungere alla story).
Per Caroselli: 6-7 foto con **Prompt Immagine** SEPARATO completo per ognuna, Canzone: [titolo — artista], Sondaggio: [Domanda?] — A: [risposta] / B: [risposta], Primo commento: [testo].

CAMPI OBBLIGATORI PER OGNI PUBBLICAZIONE (usare ESATTAMENTE queste intestazioni, nell'ordine indicato):
- Hook: [TESTO SOVRIMPRESSO breve (3-6 parole) che appare nei primi 3 secondi — NON descrivere la scena, scrivi LA FRASE ESATTA che compare a schermo per catturare l'attenzione. Es: "Non avrei mai pensato…", "La verità che nessuno dice", "Guarda cosa succede dopo"] | Posizione: [es. "alto centro", "alto sinistra", "basso centro"]
- Frase di fine: [TESTO SOVRIMPRESSO breve (3-6 parole) che appare negli ultimi 2 secondi — NON descrivere la scena, scrivi LA DOMANDA ESATTA che compare a schermo per invogliare i commenti. Deve essere una domanda che spinge lo spettatore a rispondere. Es: "Tu cosa avresti fatto?", "Quale preferisci, A o B?", "Dimmi nei commenti 👇"] | Posizione: [es. "basso centro", "alto destra", "centro schermo"]
- Canzone: [titolo esatto — artista] (SOLO per video TikTok/Reel/Caroselli; ometti per foto statiche e Stories)
- Sondaggio: [Domanda?] — A: [risposta] / B: [risposta] (SOLO per Stories, Post foto e Caroselli; NON inserire per video TikTok e Reel)
- Primo commento: [testo del primo commento da scrivere subito dopo la pubblicazione]

REGOLA HASHTAG — CRITICA:
Usa MASSIMO 5 hashtag per ogni pubblicazione. Scegli SOLO i più efficaci e pertinenti al contenuto specifico. Qualità > quantità: 5 hashtag mirati battono 30 generici. Mix consigliato: 2 di nicchia (10k-200k post), 2 medi (200k-2M), 1 trending del giorno. NO hashtag banali (#love #beautiful #instagood). Hashtag in italiano dove possibile per il pubblico italiano.

REGOLA OBBLIGATORIA — INTESTAZIONI PROMPT:
L'intestazione deve essere ESATTAMENTE **Prompt Immagine:** e **Prompt Video:** — nient'altro. NON aggiungere il nome di strumenti AI generativi nell'intestazione (es. NON scrivere "Prompt Immagine (Midjourney)", "Prompt Immagine (DALL-E)", "Prompt Video (Luma)", "Prompt Video (Runway)", "Prompt Video (Kling)" ecc.). Le specifiche tecniche della fotocamera (Canon, Sony, focale, ISO ecc.) vanno scritte DENTRO il testo del prompt, non nell'intestazione.

FASE 4 — Chiusura
- Tabella riepilogo cronologica
- Checklist MCS applicato
- Aggiornamento registro

FORMATO OUTPUT OBBLIGATORIO — CRITICO:
Ogni pubblicazione DEVE iniziare con un'intestazione markdown esattamente in questo formato:
## PUBBLICAZIONE 1 — [nome breve]
## PUBBLICAZIONE 2 — [nome breve]
(e così via per ogni contenuto)
NON usare emoji prima del ## , NON usare "POST", "REEL", "VIDEO" al posto di "PUBBLICAZIONE", NON aggiungere caratteri prima del ##. Questo formato è necessario per il parsing automatico dell'app.

Output in italiano, ben strutturato in markdown. Rispetta SEMPRE l'identity lock di Claudia: capelli shoulder-length wavy lob radici nere → magenta-fuchsia, lentiggini sottili solo naso e zigomi, occhi hazel-green, sopracciglia spesse, seno teardrop D-DD.`;

// Continue a truncated plan
router.post("/plan/continue", async (req, res) => {
  const { truncatedPlan, mcsDocument } = (req.body || {}) as {
    truncatedPlan?: string;
    mcsDocument?: string;
  };
  if (!truncatedPlan) {
    res.status(400).json({ error: "truncatedPlan richiesto" });
    return;
  }
  const jobId = `cont-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  jobs.set(jobId, { status: "pending", startedAt: Date.now() });

  runContinuation(truncatedPlan, mcsDocument, jobId).catch((err) => {
    const job = jobs.get(jobId);
    if (job) {
      jobs.set(jobId, { ...job, status: "error", error: String(err?.message ?? err) });
    }
  });

  res.json({ jobId });
});

async function runContinuation(
  truncatedPlan: string,
  mcsDocument: string | undefined,
  jobId: string,
): Promise<void> {
  const mcsNote = mcsDocument
    ? `\n=== DOCUMENTO MCS DI RIFERIMENTO ===\n${mcsDocument}\n=== FINE MCS ===\n`
    : "";

  const userMsg = `Il seguente piano giornaliero è stato troncato a metà e risulta incompleto. Analizza attentamente il testo interrotto, individua esattamente il punto di interruzione, e CONTINUA da lì senza riscrivere nulla di ciò che è già presente. Inizia la tua risposta esattamente dal punto esatto dove il testo si interrompe (anche a metà frase o a metà parola se necessario), e completa il piano fino alla fine includendo tutte le sezioni mancanti (pubblicazioni restanti, tabella riepilogo cronologica, checklist MCS applicato, aggiornamento registro).${mcsNote}

=== TESTO TRONCATO (NON RISCRIVERE — CONTINUA DA QUI) ===
${truncatedPlan}
=== FINE TESTO TRONCATO ===

Continua ora il piano dal punto di interruzione:`;

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMsg }],
  });

  let accumulated = "";
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      accumulated += event.delta.text;
    }
  }

  const message = await stream.finalMessage();
  const textBlock = message.content.find(
    (b): b is { type: "text"; text: string } => b.type === "text",
  );
  const continuation = accumulated || textBlock?.text || "";

  const job = jobs.get(jobId);
  if (job) {
    jobs.set(jobId, { ...job, status: "done", result: continuation });
  }
}

// Start a generation job and return immediately with a jobId
router.post("/plan/start", async (req, res) => {
  const body = (req.body || {}) as GenerateBody;
  const jobId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  jobs.set(jobId, { status: "pending", startedAt: Date.now() });

  // Run generation in background — do NOT await
  runGeneration(body, jobId).catch((err) => {
    const job = jobs.get(jobId);
    if (job) {
      jobs.set(jobId, { ...job, status: "error", error: String(err?.message ?? err) });
    }
  });

  res.json({ jobId });
});

// Poll endpoint — fast, always returns immediately
router.get("/plan/status/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "Job non trovato" });
    return;
  }
  res.json({
    status: job.status,
    result: job.result,
    error: job.error,
  });
});

async function runGeneration(body: GenerateBody, jobId: string): Promise<void> {
  const contentBlocks: Array<
    | { type: "text"; text: string }
    | {
        type: "image";
        source: {
          type: "base64";
          media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
          data: string;
        };
      }
  > = [];

  const validImages: Array<{ name: string; mediaType: string; data: string }> = [];
  if (Array.isArray(body.images)) {
    for (const img of body.images.slice(0, 6)) {
      const m = (img.dataUrl || "").match(
        /^data:(image\/(?:jpeg|png|gif|webp));base64,(.+)$/,
      );
      if (m) validImages.push({ name: img.name || "foto", mediaType: m[1], data: m[2] });
    }
  }

  if (validImages.length > 0) {
    contentBlocks.push({
      type: "text",
      text: `=== IMMAGINI DI RIFERIMENTO CARICATE (${validImages.length} foto) ===
Qui sotto sono allegate ${validImages.length} immagini di riferimento fornite da Claudia Venturi.
Usale OBBLIGATORIAMENTE per:
- Descrivere con precisione outfit, colori, accessori, acconciature visibili nelle foto
- Integrare nei prompt immagine i dettagli esatti degli elementi visivi (colore abito, tipo di tessuto, scarpe, gioielli, makeup tone)
- Integrare nei prompt video le caratteristiche di movimento e stile osservate
- Verificare e rafforzare l'identity lock di Claudia (capelli magenta-fuchsia, lentiggini, occhi hazel-green)
- Se le foto mostrano location specifiche, usarle come ambientazione per le scene del giorno
Nota i nomi dei file come guida al contenuto:`,
    });
    for (let i = 0; i < validImages.length; i++) {
      const img = validImages[i];
      contentBlocks.push({
        type: "text",
        text: `Immagine ${i + 1}${img.name ? ` — "${img.name}"` : ""}:`,
      });
      contentBlocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: img.mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
          data: img.data,
        },
      });
    }
    contentBlocks.push({
      type: "text",
      text: `=== FINE IMMAGINI DI RIFERIMENTO ===\nOra genera la programmazione giornaliera incorporando ciò che vedi nelle foto sopra.`,
    });
  }

  contentBlocks.push({ type: "text", text: buildUserPrompt(body) });

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: contentBlocks }],
  });

  let accumulated = "";
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      accumulated += event.delta.text;
    }
  }

  const message = await stream.finalMessage();
  const textBlock = message.content.find(
    (b): b is { type: "text"; text: string } => b.type === "text",
  );
  const full = accumulated || textBlock?.text || "";

  const job = jobs.get(jobId);
  if (job) {
    jobs.set(jobId, { ...job, status: "done", result: full });
  }
}

function buildUserPrompt(b: GenerateBody): string {
  const parts: string[] = [];
  parts.push(`Genera la programmazione giornaliera Claudia per ${b.date || "oggi"}.`);
  if (b.dayNumber) parts.push(`Numero giorno del registro: ${b.dayNumber}`);

  const vol = Number(b.contentVolume);
  if (vol > 0) {
    const list = Array.from({ length: vol }, (_, i) => `## PUBBLICAZIONE ${i + 1}`).join(", ");
    parts.push(
      `\n⚠️ OBBLIGO QUANTITÀ PUBBLICAZIONI: devi generare ESATTAMENTE ${vol} pubblicazioni nel piano di oggi. ` +
      `Crea obbligatoriamente ${vol} sezioni distinte con intestazione: ${list}. ` +
      `Non generarne di meno, non accorpare, non saltare nessuna. ` +
      `Ogni sezione PUBBLICAZIONE deve essere completa con SCENA, PROMPT IMMAGINE, PROMPT VIDEO, caption, hashtag.`
    );
  }
  if (b.weather) parts.push(`Meteo Roma: ${b.weather}`);
  if (b.grokReport) {
    parts.push(`\n=== TREND PERSONALIZZATI (forniti dall'utente) ===\n${b.grokReport}`);
  } else {
    parts.push(`\n=== TREND ===\nNessun input esterno. Genera tu autonomamente la sezione Trend Intelligence (Fase 0) con trend audio TikTok IT plausibili, format Reels per uomini 45-55, orari picco e opportunità del giorno.`);
  }
  if (b.references) {
    parts.push(`\n=== REFERENZE INFLUENCER ===\n${b.references}`);
  }
  if (b.mcsDocument) {
    parts.push(`\n=== DOCUMENTO MCS (Master Control System) ===\n${b.mcsDocument}`);
  } else {
    parts.push(`\n=== MCS ===\nUsa MCS v4.5 default (identity lock, anti-repetition, regole pillar, breast rule, text overlay rules).`);
  }
  if (b.customNotes) {
    parts.push(`\n=== NOTE PERSONALIZZATE OGGI ===\n${b.customNotes}`);
  }
  if (b.weeklyGoal) {
    parts.push(`\n=== OBIETTIVO SETTIMANALE ===\n${b.weeklyGoal}\nTieni conto di questo obiettivo nelle scelte di format, hook, call-to-action e strategia di oggi.`);
  }
  if (b.recentHistory) {
    parts.push(`\n=== MEMORIA STORICA (ultimi giorni) ===\n${b.recentHistory}\nUSA QUESTI DATI per la regola anti-repetition: evita outfit, location, musica, format già usati nei giorni indicati. Non riproporre lo stesso tipo di contenuto consecutivamente.`);
  }
  parts.push(`\nProduci il documento finale in italiano markdown, cronologico, completo di tutti i prompt pronti da copiare.`);
  return parts.join("\n");
}

export default router;

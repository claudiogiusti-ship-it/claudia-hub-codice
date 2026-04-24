import { Router, type IRouter } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router: IRouter = Router();

const EDIT_SYSTEM = `Sei un editor esperto del documento MCS (Master Control System) di Claudia Venturi.
Ricevi: 1) il documento MCS attuale, 2) un'istruzione di modifica in linguaggio naturale.
Devi restituire ESCLUSIVAMENTE il documento MCS COMPLETO aggiornato — nient'altro.
Regole assolute:
- Mantieni TUTTA la struttura esistente (sezioni, numerazione, formattazione markdown).
- Applica SOLO la modifica richiesta. Non riassumere, non tagliare, non parafrasare il resto.
- Se la modifica aggiunge una regola, inseriscila nella sezione tematica corretta.
- Se la modifica corregge una regola esistente, sostituiscila in loco preservando lo stile.
- Se l'istruzione è ambigua, fai la modifica più conservativa possibile.
- NON aggiungere preamboli, spiegazioni, commenti, blocchi \`\`\`. Restituisci direttamente il testo completo del nuovo MCS.`;

type McsJob = {
  status: "pending" | "done" | "error";
  result?: string;
  error?: string;
  startedAt: number;
};

const jobs = new Map<string, McsJob>();

// Clean up jobs older than 15 minutes
setInterval(() => {
  const cutoff = Date.now() - 15 * 60 * 1000;
  for (const [id, job] of jobs) {
    if (job.startedAt < cutoff) jobs.delete(id);
  }
}, 60_000);

// Start a new MCS edit job — returns immediately with jobId
router.post("/mcs/edit/start", (req, res) => {
  const { mcs, instruction } = (req.body || {}) as {
    mcs?: string;
    instruction?: string;
  };

  if (!instruction || !instruction.trim()) {
    res.status(400).json({ error: "instruction required" });
    return;
  }

  const jobId = `mcs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  jobs.set(jobId, { status: "pending", startedAt: Date.now() });

  runMcsEdit(mcs || "", instruction, jobId).catch((err) => {
    const job = jobs.get(jobId);
    if (job) jobs.set(jobId, { ...job, status: "error", error: String(err) });
  });

  res.json({ jobId });
});

// Poll endpoint — always returns immediately
router.get("/mcs/edit/status/:jobId", (req, res) => {
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

async function runMcsEdit(mcs: string, instruction: string, jobId: string): Promise<void> {
  const userPrompt = `=== MCS ATTUALE ===
${mcs.trim() ? mcs : "(documento vuoto — crea da zero applicando l'istruzione)"}

=== ISTRUZIONE DI MODIFICA ===
${instruction}

Restituisci ora il documento MCS COMPLETO aggiornato.`;

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: EDIT_SYSTEM,
    messages: [{ role: "user", content: userPrompt }],
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

export default router;

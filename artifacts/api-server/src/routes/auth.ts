import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

const APP_PASSWORD = process.env.APP_PASSWORD || "";

// ── Login ──────────────────────────────────────────────────────────────────
router.post("/auth/login", (req: Request, res: Response) => {
  const { password } = (req.body || {}) as { password?: string };
  if (!APP_PASSWORD) {
    res.status(500).json({ error: "APP_PASSWORD not configured" });
    return;
  }
  if (password === APP_PASSWORD) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ error: "Password errata" });
  }
});

// ── Salva piano ────────────────────────────────────────────────────────────
router.post("/history/save", async (req: Request, res: Response) => {
  const { id, date, weather, pillarFocus, platform, output, createdAt } =
    (req.body || {}) as {
      id?: string;
      date?: string;
      weather?: string;
      pillarFocus?: string;
      platform?: string;
      output?: string;
      createdAt?: string;
    };

  if (!id || !date || !output) {
    res.status(400).json({ error: "id, date, output required" });
    return;
  }

  try {
    await pool.query(
      `INSERT INTO plans (id, plan_date, weather, pillar_focus, platform, output, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [
        id,
        date,
        weather || "",
        pillarFocus || "",
        platform || "",
        output,
        createdAt ? new Date(createdAt) : new Date(),
      ],
    );
    res.json({ ok: true });
  } catch (err) {
    req.log?.error?.({ err }, "Errore salvataggio piano");
    res.status(500).json({ error: "Errore database" });
  }
});

// ── Lista piani ────────────────────────────────────────────────────────────
router.get("/history/list", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, plan_date::text AS date, weather, pillar_focus AS "pillarFocus",
              platform, LEFT(output, 300) AS output_preview, created_at AS "createdAt"
       FROM plans
       ORDER BY plan_date DESC, created_at DESC
       LIMIT 100`,
    );
    res.json({ items: result.rows });
  } catch (err) {
    req.log?.error?.({ err }, "Errore lettura cronologia");
    res.status(500).json({ error: "Errore database" });
  }
});

// ── Numero giorno registro (conteggio giorni distinti) ─────────────────────
router.get("/history/day-number", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(DISTINCT plan_date)::int AS count FROM plans`,
    );
    const count = result.rows[0]?.count ?? 0;
    res.json({ dayNumber: count + 1 });
  } catch (err) {
    req.log?.error?.({ err }, "Errore conteggio giorni");
    res.status(500).json({ error: "Errore database" });
  }
});

// ── Singolo piano completo ─────────────────────────────────────────────────
router.get("/history/:id", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, plan_date::text AS date, weather, pillar_focus AS "pillarFocus",
              platform, output, created_at AS "createdAt"
       FROM plans WHERE id = $1`,
      [req.params.id],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Non trovato" });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    req.log?.error?.({ err }, "Errore lettura piano");
    res.status(500).json({ error: "Errore database" });
  }
});

// ── Aggiorna output piano (es. dopo completamento troncato) ────────────────
router.put("/history/:id/update", async (req: Request, res: Response) => {
  const { output } = req.body as { output?: string };
  if (!output) {
    res.status(400).json({ error: "output richiesto" });
    return;
  }
  try {
    await pool.query("UPDATE plans SET output = $1 WHERE id = $2", [output, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    req.log?.error?.({ err }, "Errore aggiornamento piano");
    res.status(500).json({ error: "Errore database" });
  }
});

// ── Aggiorna data piano ────────────────────────────────────────────────────
router.put("/history/:id/date", async (req: Request, res: Response) => {
  const { date } = req.body as { date?: string };
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: "data YYYY-MM-DD richiesta" });
    return;
  }
  try {
    await pool.query("UPDATE plans SET plan_date = $1 WHERE id = $2", [date, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    req.log?.error?.({ err }, "Errore aggiornamento data piano");
    res.status(500).json({ error: "Errore database" });
  }
});

// ── Elimina piano ──────────────────────────────────────────────────────────
router.delete("/history/:id", async (req: Request, res: Response) => {
  try {
    await pool.query("DELETE FROM plans WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    req.log?.error?.({ err }, "Errore eliminazione piano");
    res.status(500).json({ error: "Errore database" });
  }
});

// ── Middleware auth token (Bearer) ─────────────────────────────────────────
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!APP_PASSWORD || token === APP_PASSWORD) {
    next();
    return;
  }
  res.status(401).json({ error: "Non autorizzato" });
}

export default router;

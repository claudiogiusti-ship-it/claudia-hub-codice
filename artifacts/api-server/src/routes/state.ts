import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();


// GET /state — load all persisted state
router.get("/state", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT key, value FROM user_state ORDER BY key`
    );
    const data: Record<string, string> = {};
    for (const row of result.rows) {
      data[row.key] = row.value;
    }
    res.json({ data });
  } catch (err) {
    req.log?.error?.({ err }, "Errore lettura stato");
    res.status(500).json({ error: "Errore database" });
  }
});

// PUT /state/:key — upsert one key
router.put("/state/:key", async (req: Request, res: Response) => {
  const key = req.params.key;
  const { value } = (req.body || {}) as { value?: string };

  if (typeof value !== "string") {
    res.status(400).json({ error: "value (string) richiesto" });
    return;
  }

  try {
    await pool.query(
      `INSERT INTO user_state (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [key, value]
    );
    res.json({ ok: true });
  } catch (err) {
    req.log?.error?.({ err }, "Errore salvataggio stato");
    res.status(500).json({ error: "Errore database" });
  }
});

export default router;

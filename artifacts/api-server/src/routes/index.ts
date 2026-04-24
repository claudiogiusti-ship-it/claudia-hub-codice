import { Router, type IRouter } from "express";
import healthRouter from "./health";
import planRouter from "./plan";
import mcsRouter from "./mcs";
import authRouter, { requireAuth } from "./auth";
import stateRouter from "./state";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(requireAuth);
router.use(planRouter);
router.use(mcsRouter);
router.use(stateRouter);

export default router;

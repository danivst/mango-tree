import { Router } from "express";
import { translateText } from "../controllers/translate-controller";
import { auth } from "../utils/auth";

const router = Router();

// Translate arbitrary text (requires authentication)
router.post("/", auth, translateText);

export default router;

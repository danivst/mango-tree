/**
 * @file translate-routes.ts
 * @description Translation API routes.
 * Provides on-demand text translation for bilingual content.
 *
 * Base path: /api/translate
 * All routes require authentication.
 */

import express, { Router } from "express";
import { translateText } from "../controllers/translate-controller";
import { auth } from "../utils/auth";

const router: Router = express.Router();

/**
 * @route POST /
 * @description Translate text to both Bulgarian and English
 * @body {text}
 * @access Authenticated
 */
router.post("/", auth, translateText);

export default router;

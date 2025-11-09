// --- file: src/app/api/docs/resume/resumes.ts

/**
 * @swagger
 * /v1/resumes:
 *   get:
 *     tags: [Resumes]
 *     summary: List resume series of current user
 *     description: Returns user's resume series with recent versions. Requires authentication cookie.
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/GetResumesResp"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorLegacy"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorLegacy"
 *   post:
 *     tags: [Resumes]
 *     summary: Create a resume series
 *     description: Creates a new resume series. Requires authentication and CSRF header.
 *     security:
 *       - CSRF: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/CreateResumeReq"
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ResumeSeries"
 *       400:
 *         description: Invalid title
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorLegacy"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorLegacy"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorLegacy"
 */

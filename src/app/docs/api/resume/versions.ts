/**
 * @swagger
 * /v1/resumes/{seriesId}/versions:
 *   get:
 *     tags: [Resumes]
 *     summary: List versions of a resume series (and series details)
 *     description: >
 *       返回指定简历系列（含 versions 列表与 activeVersion）。  
 *       需要已登录（Cookie 会话）。成功时**直接返回 ResumeSeries 对象**。
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema: { type: string }
 *         description: Resume series id
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ResumeSeries"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorLegacy"
 *       404:
 *         description: Not found (series not exists or not owned by user)
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
 *     summary: Create a new resume version in a series
 *     description: >
 *       在指定系列下新增一个版本。  
 *       请求体使用 **JSON**（不是 form-data）。  
 *       字段 `filename` 将在后端被兼容映射为 `fileName`（建议直接使用 `fileName`）。
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema: { type: string }
 *         description: Resume series id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fileKey, fileName]
 *             properties:
 *               fileKey:
 *                 type: string
 *                 example: "resumes/abc123.pdf"
 *               fileName:
 *                 type: string
 *                 example: "resume-2025-11-05.pdf"
 *               mimeType:
 *                 type: string
 *                 nullable: true
 *                 example: "application/pdf"
 *               fileSize:
 *                 type: number
 *                 nullable: true
 *                 example: 204800
 *               note:
 *                 type: string
 *                 nullable: true
 *                 example: "Imported from uploads panel"
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ResumeVersion"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorLegacy"
 *       404:
 *         description: Not found (series not exists or not owned by user)
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

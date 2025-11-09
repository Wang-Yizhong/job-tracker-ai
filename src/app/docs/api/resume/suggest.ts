/**
 * @swagger
 * /v1/resumes/suggest:
 *   post:
 *     tags: [Resumes]
 *     summary: Get AI rewriting suggestion for a single resume section
 *     description: >
 *       对简历中某一段文字（如 Summary 或某条经历）生成 AI 优化建议。  
 *       - 模型会保持原意，不新增事实、不添加虚构数据；  
 *       - 输出德语短文本建议，字段名固定为 `"suggestion"`；  
 *       - 若超出月度限额，将返回 `429` 状态码。  
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [section, text]
 *             properties:
 *               section:
 *                 type: string
 *                 description: 目标字段名（例如 "summary"、"experience_highlight" 等）
 *                 example: "summary"
 *               text:
 *                 type: string
 *                 description: 待优化的原始文本（最大约 1500 字符）
 *                 example: >
 *                   Erfahrene Frontend-Entwicklerin mit Fokus auf React und TypeScript,
 *                   verantwortlich für UI-Komponenten und Performanceoptimierung.
 *               jobContext:
 *                 type: string
 *                 nullable: true
 *                 description: （可选）目标职位或上下文，用于定向改写
 *                 example: "Frontend Developer für SaaS-Plattform"
 *     responses:
 *       200:
 *         description: OK — 返回建议文本
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 suggestion:
 *                   type: string
 *                   example: >
 *                     Frontend-Entwicklerin mit Schwerpunkt auf React und TypeScript.
 *                     Erfahrung in der Entwicklung performanter UI-Komponenten für SaaS-Produkte.
 *       400:
 *         description: Parameter fehlen（缺少字段或文本为空）
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string, example: "Parameter fehlen" }
 *       429:
 *         description: Monatslimit erreicht（月度限额已达）
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string, example: "Monatslimit erreicht" }
 *                 meta:
 *                   type: object
 *                   description: 可选的配额详情
 *       500:
 *         description: SERVER_ERROR（服务器内部错误或 OpenAI 调用异常）
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string, example: "Vorschlag fehlgeschlagen" }
 */

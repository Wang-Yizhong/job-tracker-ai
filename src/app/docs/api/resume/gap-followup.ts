/**
 * @swagger
 * /v1/resumes/gap-followup:
 *   post:
 *     tags: [Resumes]
 *     summary: Generate one concise follow-up question for missing STAR parts
 *     description: >
 *       根据用户的原始回答与已识别的“缺失要素”（STAR 维度），生成**一条**简洁的追问（followup）以及一段可直接填写的输入模板（prefill）。  
 *       **注意**：接口包含全局月度频控（429 RATE_LIMITED）。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question, skill, answer, missing]
 *             properties:
 *               question:
 *                 type: string
 *                 description: 面试官原始问题
 *                 example: "Erzählen Sie von einem Projekt, in dem Sie die Performance verbessert haben."
 *               skill:
 *                 type: string
 *                 description: 关联技能/主题
 *                 example: "Web Performance Optimization"
 *               answer:
 *                 type: string
 *                 description: 候选人的当前回答文本（模型会自动截断过长内容）
 *                 example: "Ich habe die LCP von 4.2s auf 2.1s gesenkt, indem ich..."
 *               missing:
 *                 type: array
 *                 description: 缺失的 STAR 维度（德语关键词）
 *                 items:
 *                   type: string
 *                   enum: ["ort","zeit","unternehmen","aufgabe","aktion","zahlen"]
 *                 example: ["zeit","zahlen"]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 followup:
 *                   type: string
 *                   description: 一条简短、明确的追问（1–2 句）
 *                   example: "Wann genau (MM.JJJJ–MM.JJJJ) haben Sie daran gearbeitet und welches messbare Ergebnis (%, ms, Nutzer) wurde erreicht?"
 *                 prefill:
 *                   type: string
 *                   description: 可直接填写的输入模板
 *                   example: "Zeit (MM.JJJJ–MM.JJJJ): …; Unternehmen: …; Ergebnis (%, ms, Nutzer): …"
 *       400:
 *         description: bad_request（缺少必要字段）
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: string, example: "bad_request" }
 *                 message: { type: string, example: "Parameter fehlen" }
 *       429:
 *         description: RATE_LIMITED（月度配额用尽）
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: string, example: "RATE_LIMITED" }
 *                 message: { type: string, example: "Monatslimit erreicht" }
 *       500:
 *         description: SERVER_ERROR（模型或服务端异常）
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: string, example: "SERVER_ERROR" }
 *                 message: { type: string, example: "Follow-up fehlgeschlagen" }
 */

/**
 * @swagger
 * /v1/resumes/gap-questions:
 *   post:
 *     tags: [Resumes]
 *     summary: Chat-style coaching — ask one targeted question or condense answer
 *     description: >
 *       基于候选人的 **简历(`resume`)**、**匹配结果(`match`)**、**对话历史(`dialog`)** 与 **最新输入(`userInput`)**，
 *       返回一条教练式回复：  
 *       - 若 STAR 要素缺失：提出**恰好一条**精准补充问题；  
 *       - 若信息充足：**简短总结**并给出**下一步补充建议**（如量化、工具等）。  
 *       **频控**：生产环境可开启全局月度配额（不足时 429）。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [resume, match, userInput]
 *             properties:
 *               resume:
 *                 $ref: "#/components/schemas/ResumeData"
 *               match:
 *                 type: object
 *                 properties:
 *                   rows:
 *                     type: array
 *                     items:
 *                       type: object
 *                       required: [skill, state]
 *                       properties:
 *                         skill: { type: string, example: "Web Performance Optimization" }
 *                         state:
 *                           type: string
 *                           enum: ["hit", "partial", "miss"]
 *                         must:
 *                           type: boolean
 *                           description: 是否为“必须命中”的需求
 *                   total: { type: integer, nullable: true }
 *                   covered: { type: integer, nullable: true }
 *               dialog:
 *                 type: array
 *                 description: 可选的历史对话（仅最近若干条会参与）
 *                 items:
 *                   type: object
 *                   required: [role, content]
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: ["system","user","assistant"]
 *                     content:
 *                       type: string
 *               userInput:
 *                 type: string
 *                 description: 用户本轮输入（最少 20 字符）
 *                 example: "Ich habe die LCP mit Code-Splitting und Bildoptimierung gesenkt ..."
 *     responses:
 *       200:
 *         description: OK — 返回教练式回复
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *                 message:
 *                   type: object
 *                   required: [role, content]
 *                   properties:
 *                     role: { type: string, example: "assistant" }
 *                     content:
 *                       type: string
 *                       description: 助手输出（2–5 句，可能含“补充问题”或“总结+下一步建议”）
 *                     meta:
 *                       type: object
 *                       properties:
 *                         focusSkill:
 *                           type: string
 *                           nullable: true
 *                           description: 本轮重点关注的技能（由服务端推断）
 *       400:
 *         description: 参数错误（缺字段或 userInput 过短）
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:    { type: boolean, example: false }
 *                 code:  { type: string, enum: ["bad_request","short_input"], example: "short_input" }
 *                 message:
 *                   type: string
 *                   example: "Antwort zu kurz (>= 20 Zeichen)."
 *       429:
 *         description: RATE_LIMITED（月度配额耗尽，生产环境可能开启）
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:   { type: boolean, example: false }
 *                 code: { type: string, example: "RATE_LIMITED" }
 *                 message:
 *                   type: string
 *                   example: "Monatslimit erreicht"
 *       500:
 *         description: SERVER_ERROR（模型或服务端异常）
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:   { type: boolean, example: false }
 *                 code: { type: string, example: "SERVER_ERROR" }
 *                 message:
 *                   type: string
 *                   example: "internal error"
 */

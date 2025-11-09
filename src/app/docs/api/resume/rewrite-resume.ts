/**
 * @swagger
 * /v1/resumes/rewrite:
 *   post:
 *     tags: [Resumes]
 *     summary: Integrate Q&A bullets into Resume and polish summary
 *     description: >
 *       将用户对“能力缺口问题（gap-questions）”的回答，提炼为 2–3 条要点并合并到指定经历的 highlights；  
 *       若月度配额允许，再用 AI 在**不新增事实**的前提下润色 `summary`（2–3 句，≤~420 字符）。  
 *       **注意**：当频控不足或模型失败时，会优雅降级，直接返回结构化合并后的简历（200）。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [resume, questions, answers]
 *             properties:
 *               resume:
 *                 $ref: "#/components/schemas/ResumeData"
 *               questions:
 *                 type: array
 *                 description: 先前下发的能力缺口问题清单
 *                 items:
 *                   type: object
 *                   required: [id, skill, question]
 *                   properties:
 *                     id:       { type: string, example: "q_01" }
 *                     skill:    { type: string, example: "Web Performance Optimization" }
 *                     must:     { type: boolean, example: true }
 *                     question: { type: string, example: "Wann, wo und mit welchem messbaren Ergebnis haben Sie die LCP verbessert?" }
 *                     hint:     { type: string, nullable: true }
 *               answers:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *                 description: 以 question.id 为键的用户回答映射
 *                 example:
 *                   q_01: "2024 bei ACME Shop: Mit Code-Splitting und Bildoptimierung LCP von 4.2s auf 2.1s gesenkt."
 *     responses:
 *       200:
 *         description: OK — 返回优化后的完整简历数据（可能含润色后的 summary）
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ResumeData"
 *       400:
 *         description: 参数错误（缺少 resume / questions / answers 或格式不正确）
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:    { type: string, example: "bad_request" }
 *                 message: { type: string, example: "resume/questions/answers erforderlich" }
 *       500:
 *         description: SERVER_ERROR（服务端异常）
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:    { type: string, example: "SERVER_ERROR" }
 *                 message: { type: string, example: "failed" }
 */

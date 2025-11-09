/**
 * @swagger
 * /v1/resumes/match:
 *   post:
 *     tags: [Resumes]
 *     summary: Build a simple JD–Resume match matrix
 *     description: >
 *       根据职位信息（requirements/tags/skills/描述文本）与候选人简历，生成**命中矩阵**：  
 *       - 先把 JD 的要求归一化为去重后的技能项；  
 *       - 再用简历中的技能/文本关键词进行命中判定；  
 *       - 输出每条技能的命中状态（hit/partial/miss）与建议补充文案。  
 *       **注意**：这是启发式算法，不调用大模型。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [job]
 *             properties:
 *               job:
 *                 type: object
 *                 description: 解析后的 JD（任一来源字段存在即可）
 *                 properties:
 *                   requirements:
 *                     description: 要求清单（字符串或带 must/weight 的对象）
 *                     oneOf:
 *                       - type: array
 *                         items: { type: string, example: "React" }
 *                       - type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             text:   { type: string, example: "React" }
 *                             must:   { type: boolean, example: true }
 *                             weight: { type: number, example: 5 }
 *                             group:  { type: string, example: "Tech" }
 *                             raw:    { type: string }
 *                   tags:
 *                     type: array
 *                     items: { type: string }
 *                     example: ["TypeScript","Next.js"]
 *                   skills:
 *                     type: array
 *                     items: { type: string }
 *                     example: ["React","Zustand","Jest"]
 *                   title:       { type: string, example: "Senior Frontend Engineer" }
 *                   summary:     { type: string }
 *                   description:  { type: string }
 *                   text:        { type: string }
 *                   raw:         { type: string }
 *               resume:
 *                 description: 候选人简历（可选；缺省则仅基于 JD 提取关键词构造矩阵）
 *                 $ref: "#/components/schemas/ResumeData"
 *     responses:
 *       200:
 *         description: OK — 返回匹配矩阵
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rows:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       skill:      { type: string, example: "React" }
 *                       must:       { type: boolean, example: true }
 *                       score:      { type: number, example: 5 }
 *                       state:
 *                         type: string
 *                         enum: ["hit","partial","miss"]
 *                       matched:    { type: boolean, example: true }
 *                       suggestion:
 *                         nullable: true
 *                         type: string
 *                         example: "Ergänze die Punkte zu React: Projekt, Aufgabe, konkrete Handlungen, quantifizierbare Ergebnisse …"
 *                 covered: { type: integer, example: 8, description: 命中（hit）条数 }
 *                 total:   { type: integer, example: 12, description: 总需求条数 }
 *       400:
 *         description: Bad request（JSON 不合法或 job 缺失）
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid job payload"
 */

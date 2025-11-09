/**
 * @swagger
 * /v1/resumes/parse-resume:
 *   post:
 *     tags: [Resumes]
 *     summary: Parse a resume file into structured data
 *     description: >
 *       从文件中提取文本并结构化为简历数据。  
 *       - **来源其一**：`url`（仅允许白名单主机；当前：`*.supabase.co` 两个域名）。  
 *       - **来源其二**：`fileKey`（服务端从存储读取）。  
 *       - 二者至少提供其一；可选传 `filename` 影响类型判断与解析提示。  
 *       - 体积上限：**15 MB**；下载超时：**20s**。  
 *       - 成功时**直接返回结构化对象**（不包 `{ data: ... }`）。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileKey:
 *                 type: string
 *                 description: 存储中的文件 Key（与 url 二选一）
 *                 example: "resumes/abc123.pdf"
 *               filename:
 *                 type: string
 *                 description: 文件名（可选；用于类型推断与日志）
 *                 example: "resume-en.pdf"
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: 受白名单限制的直链地址（与 fileKey 二选一）
 *                 example: "https://tyvshioiuupglckpvgxu.supabase.co/storage/v1/object/public/resumes/abc123.pdf"
 *           examples:
 *             byUrl:
 *               summary: 通过 URL 解析
 *               value:
 *                 url: "https://tyvshioiuupglckpvgxu.supabase.co/storage/v1/object/public/resumes/abc123.pdf"
 *                 filename: "resume.pdf"
 *             byFileKey:
 *               summary: 通过 fileKey 解析
 *               value:
 *                 fileKey: "resumes/abc123.pdf"
 *     responses:
 *       200:
 *         description: Parsed ok — 返回结构化简历数据（直接对象）
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ResumeData"
 *       400:
 *         description: 请求体不合法 / URL 无效
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorLegacy"
 *       403:
 *         description: URL 不在白名单
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorLegacy"
 *       413:
 *         description: 文件过大（> 15MB）
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorLegacy"
 *       415:
 *         description: 不支持的文件类型（仅 PDF/DOC/DOCX）
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorLegacy"
 *       422:
 *         description: 未读到文件内容 / 未能提取文本
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorLegacy"
 *       504:
 *         description: 下载超时（20 秒）
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorLegacy"
 *       500:
 *         description: 解析失败（其他服务器错误）
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorLegacy"
 */

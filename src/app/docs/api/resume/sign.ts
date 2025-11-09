/**
 * @swagger
 * /v1/resumes/sign:
 *   post:
 *     tags: [Resumes]
 *     summary: Generate a signed download URL for a resume file
 *     description: >
 *       根据传入的 `fileKey` 生成一个带有 10 分钟有效期的签名下载链接。  
 *       仅支持当前用户自己的文件（`fileKey` 必须以用户 uid 开头）。  
 *       成功时返回签名 URL 与文件名。
 *     security:
 *       - CSRF: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fileKey]
 *             properties:
 *               fileKey:
 *                 type: string
 *                 description: 文件在存储中的路径 Key，必须以当前用户 uid 开头
 *                 example: "user_abc/resumes/abc123.pdf"
 *               downloadName:
 *                 type: string
 *                 nullable: true
 *                 description: 下载时显示的文件名（可选）
 *                 example: "resume-download.pdf"
 *     responses:
 *       200:
 *         description: Signed URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: 签名下载 URL（10 分钟有效）
 *                   example: "https://tysadejbjdmplxambrfq.supabase.co/storage/v1/object/sign/resumes/abc123.pdf?token=..."
 *                 filename:
 *                   type: string
 *                   example: "resume.pdf"
 *       400:
 *         description: Invalid fileKey（body 缺少或字段为空）
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorLegacy"
 *       401:
 *         description: Not authenticated（用户未登录）
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorLegacy"
 *       403:
 *         description: Forbidden（fileKey 不属于当前用户）
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorLegacy"
 *       500:
 *         description: Server error（Supabase 错误或其他异常）
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorLegacy"
 */

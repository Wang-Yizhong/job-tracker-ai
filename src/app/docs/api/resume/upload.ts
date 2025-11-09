/**
 * @swagger
 * /v1/resumes/upload:
 *   post:
 *     tags: [Resumes]
 *     summary: Upload a resume file (PDF/DOCX) and create a new series/version if needed
 *     description: >
 *       需要登录（Cookie 会话）。  
 *       仅支持 **PDF** 与 **DOCX**，最大 **5MB**。  
 *       - 若按 `userId + language` 找到已有系列，则在其下创建新版本；  
 *       - 否则自动创建系列并作为首个版本；  
 *       - 若系列尚无激活版本，将把本次上传设为激活版本。  
 *       成功返回带 `ok: true` 的信封与版本/系列的关键数据。
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 待上传的简历文件（PDF 或 DOCX）
 *               language:
 *                 type: string
 *                 description: 可选语言标识（将用于系列分组），字母/连字符
 *                 example: "en"
 *           encoding:
 *             file:
 *               contentType: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
 *     responses:
 *       200:
 *         description: Upload success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     resumeId: { type: string, example: "ser_123" }
 *                     versionId: { type: string, example: "ver_456" }
 *                     fileName: { type: string, example: "resume-2025-11-05.pdf" }
 *                     mime: { type: string, example: "application/pdf" }
 *                     size: { type: integer, example: 204800 }
 *                     uploadedAt: { type: string, format: date-time, example: "2025-11-05T16:10:00.000Z" }
 *                     fileKey: { type: string, example: "user_abc/en/df1f6e6b-9a2a-4f3a-9d9a-1b2c3d4e5f6a.pdf" }
 *                     language:
 *                       type: string
 *                       nullable: true
 *                       example: "en"
 *       400:
 *         description: No file / Invalid language
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: false }
 *                 error:
 *                   type: object
 *                   properties:
 *                     code: { type: integer, example: 400 }
 *                     message: { type: string, example: "No file" }
 *                     details: { nullable: true }
 *       401:
 *         description: UNAUTHORIZED（未登录）
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: false }
 *                 error:
 *                   type: object
 *                   properties:
 *                     code: { type: integer, example: 401 }
 *                     message: { type: string, example: "UNAUTHORIZED" }
 *                     details: { nullable: true }
 *       413:
 *         description: PAYLOAD_TOO_LARGE（超过 5MB）
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: false }
 *                 error:
 *                   type: object
 *                   properties:
 *                     code: { type: integer, example: 413 }
 *                     message: { type: string, example: "PAYLOAD_TOO_LARGE" }
 *                     details: { nullable: true }
 *       415:
 *         description: UNSUPPORTED_MEDIA_TYPE（仅支持 PDF/DOCX）
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: false }
 *                 error:
 *                   type: object
 *                   properties:
 *                     code: { type: integer, example: 415 }
 *                     message: { type: string, example: "UNSUPPORTED_MEDIA_TYPE" }
 *                     details: { nullable: true }
 *       500:
 *         description: INTERNAL / STORAGE_UPLOAD_FAILED
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: false }
 *                 error:
 *                   type: object
 *                   properties:
 *                     code: { type: integer, example: 500 }
 *                     message:
 *                       type: string
 *                       example: "INTERNAL"
 *                     details:
 *                       nullable: true
 *                       example: "Upload failed"
 */

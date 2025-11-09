/**
 * @swagger
 * /v1/auth/resend-verify:
 *   post:
 *     tags: [Auth]
 *     summary: Resend email verification
 *     description: 根据邮箱重发验证邮件。用户不存在或已验证也返回 200（避免枚举），分别体现为 `_devHint` 或 `alreadyVerified`。
 *     security:
 *       - CSRF: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: 统一返回 200
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     ok: { type: boolean, example: true }
 *                     emailSent: { type: boolean, example: true }
 *                 - type: object
 *                   properties:
 *                     ok: { type: boolean, example: true }
 *                     alreadyVerified: { type: boolean, example: true }
 *                 - type: object
 *                   properties:
 *                     ok: { type: boolean, example: true }
 *                     _devHint:
 *                       type: string
 *                       example: user_not_found
 *       400:
 *         description: 请求体非法（邮箱格式错误等）
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: false }
 *                 error: { type: string, example: INVALID_EMAIL }
 *                 details:
 *                   type: object
 *                   description: Zod error.flatten() 的结果
 *       500:
 *         description: 服务器内部错误（颁发 token 或发送邮件失败）
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: false }
 *                 error:
 *                   type: string
 *                   example: ISSUE_TOKEN_FAILED
 */
export {};

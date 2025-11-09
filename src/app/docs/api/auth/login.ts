/**
 * @swagger
 * /v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email & password
 *     description: 验证邮箱与密码，成功后通过 HttpOnly Cookie 下发会话。邮箱未验证时返回 403。
 *     security:
 *       - CSRF: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: P@ssw0rd!
 *               rememberMe:
 *                 type: boolean
 *                 description: 勾选则 30 天，会话否则 4 小时
 *                 example: true
 *     responses:
 *       200:
 *         description: 登录成功（会通过 Set-Cookie 下发会话）
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *             description: HttpOnly; Secure; SameSite=Lax
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 id:
 *                   type: string
 *                   example: usr_123
 *                 email:
 *                   type: string
 *                   example: user@example.com
 *       401:
 *         description: 凭证错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: false }
 *                 code: { type: string, example: INVALID_CREDENTIALS }
 *                 message: { type: string, example: Invalid credentials }
 *       403:
 *         description: 邮箱未验证
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: false }
 *                 code: { type: string, example: EMAIL_NOT_VERIFIED }
 *                 message: { type: string, example: Email not verified }
 *       422:
 *         description: 参数校验失败（Zod）
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: false }
 *                 code: { type: string, example: VALIDATION_ERROR }
 *                 message: { type: string, example: Invalid request body }
 *                 details:
 *                   type: array
 *                   items: { type: string }
 */
export {};

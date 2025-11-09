/**
 * @swagger
 * /v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user and send verification email
 *     description: 注册新用户（若邮箱已存在则跳过创建）。未验证则发送验证邮件；已验证返回 alreadyVerified。
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
 *                 minLength: 8
 *                 example: P@ssword123
 *     responses:
 *       200:
 *         description: 成功
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
 *                     devNote:
 *                       type: string
 *                       example: 用户已验证，未重发 token
 *       422:
 *         description: 参数校验失败
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
 *       500:
 *         description: 服务器内部错误（发送邮件/签发 token 失败）
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: false }
 *                 code: { type: string, example: INTERNAL_ERROR }
 *                 message: { type: string, example: Failed to send verification email }
 */
export {};

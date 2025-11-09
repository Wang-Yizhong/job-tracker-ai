/**
 * @swagger
 * /v1/auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify user email via token
 *     description: 校验邮箱验证令牌，成功则激活账户。
 *     security:
 *       - CSRF: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *                 minLength: 10
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: 验证成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *       400:
 *         description: 验证失败（无效/过期/已使用）或请求体非法
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: false }
 *                 error:
 *                   type: string
 *                   example: Invalid token
 */
export {};

/**
 * @swagger
 * /v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout current user
 *     description: 清除当前会话 Cookie，实现登出。
 *     security:
 *       - CSRF: []
 *     responses:
 *       200:
 *         description: 登出成功（Cookie 已清空）
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *             description: 会话 Cookie 过期（expires=0）
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 */
export {};

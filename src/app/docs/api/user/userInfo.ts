/**
 * @swagger
 * /v1/user/userInfo:
 *   get:
 *     tags: [User]
 *     summary: Get current user (by session cookie)
 *     description: |
 *       通过会话 Cookie 返回当前用户最小字段；未登录返回 401 与 `{ user: null }`。
 *     responses:
 *       200:
 *         description: 已登录
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   required: [id, email]
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: usr_123456
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: user@example.com
 *       401:
 *         description: 未登录或会话无效
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   nullable: true
 *                   example: null
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to fetch user info
 */
export {};

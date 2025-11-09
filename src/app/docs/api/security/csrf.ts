/**
 * @swagger
 * /v1/security/csrf:
 *   get:
 *     tags: [Security]
 *     summary: Issue a CSRF token cookie (double-submit)
 *     description: >
 *       生成一个随机 CSRF token，并以 **`csrf`** 名称写入 Cookie。前端在所有写操作
 *       (POST/PUT/PATCH/DELETE) 中应将该值放到请求头 **`X-CSRF-Token`**，以配合
 *       middleware 的 double-submit 校验。  
 *       Cookie 属性：`HttpOnly=false`、`SameSite=Strict`、`Path=/`、`Max-Age=3600`。
 *     responses:
 *       200:
 *         description: OK — CSRF cookie 已下发
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *             description: >
 *               包含 `csrf=<token>; Path=/; SameSite=Strict; Max-Age=3600; HttpOnly=false`（生产环境会带 `Secure`）。
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 */

// 仅为确保被当作模块加载；无实际导出内容
export {};

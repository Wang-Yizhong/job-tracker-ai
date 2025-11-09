/**
 * @swagger
 * /v1/resumes/{seriesId}/activate:
 *   post:
 *     tags: [Resumes]
 *     summary: Activate a specific resume version under a series
 *     description: >
 *       根据传入的 `versionId`，将该版本设为指定简历系列的激活版本。  
 *       需要已登录（通过 Cookie 会话）。  
 *       成功返回 `{ ok: true, series: ResumeSeries }`。
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema:
 *           type: string
 *         description: Resume series id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [versionId]
 *             properties:
 *               versionId:
 *                 type: string
 *                 description: The target resume version id to activate
 *                 example: "ver_123"
 *     responses:
 *       200:
 *         description: Activated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 series:
 *                   $ref: "#/components/schemas/ResumeSeries"
 *       400:
 *         description: Missing seriesId / versionId required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorLegacy"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorLegacy"
 *       404:
 *         description: Series or Version not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorLegacy"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorLegacy"
 */

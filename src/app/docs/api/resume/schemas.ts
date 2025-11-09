/**
 * @swagger
 * components:
 *   securitySchemes:
 *     CSRF:
 *       type: apiKey
 *       in: header
 *       name: X-CSRF-Token
 *       description: CSRF token for mutating requests
 *
 *   schemas:
 *     ErrorLegacy:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Not authenticated"
 *
 *     ErrorEnvelope:
 *       type: object
 *       properties:
 *         ok:
 *           type: boolean
 *           example: false
 *         error:
 *           type: object
 *           properties:
 *             code: { type: string, example: "INTERNAL" }
 *             message: { type: string, example: "Upload failed" }
 *             details: { nullable: true }
 *
 *     ResumeExperience:
 *       type: object
 *       properties:
 *         company:   { type: string, example: "ACME GmbH" }
 *         role:      { type: string, example: "Frontend Developer" }
 *         period:    { type: string, example: "2023–2025" }
 *         location:  { type: string, example: "Stuttgart" }
 *         startDate: { type: string, format: date, nullable: true }
 *         endDate:   { type: string, format: date, nullable: true }
 *         techStack:
 *           type: array
 *           items: { type: string }
 *           example: ["React","TypeScript","Next.js"]
 *         highlights:
 *           type: array
 *           items: { type: string }
 *           example:
 *             - "LCP von 4.2s auf 2.1s gesenkt (Code-Splitting, Bildoptimierung)"
 *             - "Design-System Komponentenbibliothek aufgebaut (shadcn/ui, Tailwind)"
 *
 *     ResumeEducation:
 *       type: object
 *       properties:
 *         school:   { type: string, example: "University of Somewhere" }
 *         degree:   { type: string, example: "B.Sc. Computer Science" }
 *         field:    { type: string, example: "Informatik" }
 *         period:   { type: string, example: "2016–2020" }
 *         highlights:
 *           type: array
 *           items: { type: string }
 *
 *     ResumeData:
 *       type: object
 *       properties:
 *         name:      { type: string, example: "Yijun Wang" }
 *         title:     { type: string, example: "Frontend Engineer" }
 *         summary:   { type: string, example: "Frontend-Entwicklerin mit Fokus auf React/TS, Performance und DX." }
 *         skills:
 *           type: array
 *           items: { type: string }
 *           example: ["React","TypeScript","Next.js","Zustand","Jest"]
 *         experiences:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/ResumeExperience"
 *         education:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/ResumeEducation"
 *         lang:
 *           type: string
 *           nullable: true
 *           example: "de"
 *         rawText:
 *           type: string
 *           nullable: true
 *         meta:
 *           type: object
 *           nullable: true
 *         sectionsOrder:
 *           type: array
 *           items: { type: string }
 *
 *     ResumeVersion:
 *       type: object
 *       properties:
 *         id:         { type: string, example: "ver_123" }
 *         fileKey:    { type: string, example: "user123/de/abc.docx" }
 *         fileName:   { type: string, example: "Lebenslauf.docx" }
 *         mimeType:   { type: string, example: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }
 *         fileSize:   { type: integer, example: 245678 }
 *         uploadedAt: { type: string, format: date-time }
 *         isActive:   { type: boolean, example: true }
 *
 *     ResumeSeries:
 *       type: object
 *       properties:
 *         id:       { type: string, example: "ser_123" }
 *         userId:   { type: string, example: "user_abc" }
 *         title:    { type: string, example: "My Resume (DE)" }
 *         language: { type: string, nullable: true, example: "de" }
 *         updatedAt:{ type: string, format: date-time }
 *         activeVersion:
 *           oneOf:
 *             - $ref: "#/components/schemas/ResumeVersion"
 *             - { type: "null" }
 *         versions:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/ResumeVersion"
 *
 *     GetResumesResp:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/ResumeSeries"
 *
 *     CreateResumeReq:
 *       type: object
 *       required: [title]
 *       properties:
 *         title:    { type: string, example: "Senior FE Resume" }
 *         language: { type: string, nullable: true, example: "en" }
 *
 *     ResumeUploadOk:
 *       type: object
 *       properties:
 *         ok:   { type: boolean, example: true }
 *         data:
 *           type: object
 *           properties:
 *             resumeId:   { type: string, example: "ser_123" }
 *             versionId:  { type: string, example: "ver_456" }
 *             fileName:   { type: string, example: "resume.pdf" }
 *             mime:       { type: string, example: "application/pdf" }
 *             size:       { type: integer, example: 524288 }
 *             uploadedAt: { type: string, format: date-time }
 *             fileKey:    { type: string, example: "user123/en/uuid.pdf" }
 *             language:   { type: string, nullable: true, example: "en" }
 */
export {};

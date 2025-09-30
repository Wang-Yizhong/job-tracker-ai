// 声明根模块（你代码里依然写 `import pdfParse from "pdf-parse"`）
declare module "pdf-parse" {
  export interface PdfParseResult {
    text: string;
    numpages?: number;
    numrender?: number;
    info?: Record<string, any>;
    metadata?: any;
    version?: string;
  }
  const pdfParse: (
    data: Buffer | Uint8Array,
    options?: any
  ) => Promise<PdfParseResult>;
  export default pdfParse;
}

// 保险起见，连内部实现也声明一下（如果你某处直接引内部路径）
declare module "pdf-parse/lib/pdf-parse.js" {
  export { PdfParseResult } from "pdf-parse";
  const pdfParse: (
    data: Buffer | Uint8Array,
    options?: any
  ) => Promise<PdfParseResult>;
  export default pdfParse;
}

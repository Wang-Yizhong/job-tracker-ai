// --- file: src/features/user/api/userApi.ts
import { http } from "@/lib/api/http";
import { joinApiPath } from "@/lib/api/config";
import type { UserInfo } from "@/features/user/types";

/** GET /api/v1/user/userInfo —— 通过会话获取当前用户信息 */
export async function fetchUserInfo(): Promise<UserInfo> {
  const resp = await http.get<{ user: UserInfo }>(
    joinApiPath("/user/userInfo"),
    { headers: { "Cache-Control": "no-store" } }
  );
  return resp?.user ?? null;
}

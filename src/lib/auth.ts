import { cookies } from "next/headers";
import { cookieName, verifySessionValue } from "@/lib/session";

export async function requireUserId() {
  const jar = await cookies();
  const raw = jar.get(cookieName)?.value;
  if (!raw) return null;

  const payload = verifySessionValue(raw);
  if (!payload) return null;

  return payload.uid as string; 
}

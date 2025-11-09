// 统一的 Jobs API 调用器（走 http + joinApiPath）

import { http } from "@/lib/api/http";
import { joinApiPath } from "@/lib/api/config";
import type {
  Job,
  JobsListResponse,
  JobsQueryParams,
  JobStatus,
} from "../types";

function buildQuery(params: JobsQueryParams = {}) {
  const { page = 1, pageSize = 20, query, status, sort } = params;
  const q = new URLSearchParams();
  q.set("page", String(page));
  q.set("pageSize", String(pageSize));
  if (query && query.trim()) q.set("q", query.trim());
  if (status && status !== "all") q.set("status", status as JobStatus);
  if (sort && sort.trim()) q.set("sort", sort.trim());
  return q.toString();
}

/** GET /api/v1/jobs -> { data: Job[], meta/pagination... } */
export async function listJobs(params: JobsQueryParams) {
  const qs = buildQuery(params);
  // 你的 http 拦截器返回的是 resp.data，这里拿到的就是 { data, total, pagination }
  return http.get<JobsListResponse>(joinApiPath(`/jobs${qs ? `?${qs}` : ""}`));
}

/** POST /api/v1/jobs -> { data: Job } */
export async function createJob(payload: Omit<Job, "id">) {
  const resp = await http.post<{ data: Job }>(joinApiPath("/jobs"), payload);
  return resp.data;
}

/** PATCH /api/v1/jobs/:id -> { data: Job } */
export async function updateJob(id: string, patch: Partial<Job>) {
  const resp = await http.patch<{ data: Job }>(joinApiPath(`/jobs/${id}`), patch);
  return resp.data;
}

/** DELETE /api/v1/jobs/:id -> 204/200 */
export async function deleteJob(id: string) {
  await http.delete(joinApiPath(`/jobs/${id}`));
}

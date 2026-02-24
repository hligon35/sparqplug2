import { api } from "./api";

export type MarketingModule = "seo" | "social" | "ads" | "email" | "reporting" | string;

// Backend response keeps: { output: { format, text, meta? }, ... }
export type MarketingTaskOutput = {
  format: string;
  text?: string;
  meta?: any;
  [k: string]: any;
};

export type RunMarketingTaskResult =
  | {
      ok: true;
      data: any;
    }
  | {
      ok: false;
      error: string;
      details?: any;
    };

export async function runMarketingTask(
  clientId: number,
  module: MarketingModule,
  taskType: string,
  outputFormat: "json" | "markdown" | string = "markdown"
): Promise<RunMarketingTaskResult> {
  try {
    const res = await api.post("/ai/marketing-task/", {
      client_id: clientId,
      module,
      task_type: taskType,
      output_format: outputFormat
    });

    return { ok: true, data: res.data };
  } catch (e: any) {
    const message =
      e?.response?.data?.detail ??
      e?.response?.data?.non_field_errors?.[0] ??
      e?.message ??
      "Unable to run marketing task";

    return { ok: false, error: String(message), details: e?.response?.data };
  }
}

// --- Change Summary ---
// Added mobile service wrapper for POST /ai/marketing-task/ with typed, graceful error handling.

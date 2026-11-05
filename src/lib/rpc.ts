import { config } from "./config";

export class RpcError extends Error {
  code: number | string;
  data?: unknown;
  constructor(message: string, code: number | string, data?: unknown) {
    super(message);
    this.name = "RpcError";
    this.code = code;
    this.data = data;
  }
}

export async function rpc<T = unknown>(
  method: string,
  params: unknown[] = [],
  url: string = config.gatewayUrl,
): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) {
    throw new RpcError(`HTTP ${res.status} from ${url}`, "HTTP");
  }
  const body = (await res.json()) as {
    result?: T;
    error?: { code: number; message: string; data?: unknown };
  };
  if (body.error) {
    throw new RpcError(body.error.message, body.error.code, body.error.data);
  }
  return body.result as T;
}

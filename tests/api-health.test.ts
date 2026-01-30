import type { IncomingMessage, ServerResponse } from "node:http";
import { createServer } from "node:http";
import { describe, expect, it } from "vitest";
import request from "supertest";
import { GET } from "@/app/api/health/route";
import { healthResponseSchema } from "@/lib/api/health-schema";

function createRequestFromNode(req: IncomingMessage) {
  const url = `http://localhost${req.url ?? "/"}`;
  return new Request(url, {
    method: req.method ?? "GET",
    headers: req.headers as HeadersInit,
  });
}

describe("GET /api/health", () => {
  it("returns service health payload", async () => {
    const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      const requestInstance = createRequestFromNode(req);
      const response = await GET(requestInstance);

      res.statusCode = response.status;
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      res.end(await response.text());
    });

    await request(server)
      .get("/api/health")
      .expect(200)
      .expect((res: request.Response) => {
        const parsed = healthResponseSchema.safeParse(res.body);
        expect(parsed.success).toBe(true);
        if (parsed.success) {
          expect(parsed.data.status).toBe("ok");
          expect(parsed.data.service).toBe("supabase-boilerplate");
          expect(parsed.data.timestamp).toBeDefined();
        }
      });

    server.close();
  });
});

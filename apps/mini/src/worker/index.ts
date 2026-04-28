import { app } from "../server/routes";
import type { Env } from "../server/env";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      return app.fetch(request, env, ctx);
    }
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    return new Response("APoW Mini worker is running. Build the client to serve the app.", {
      status: 200,
      headers: { "content-type": "text/plain" },
    });
  },
};

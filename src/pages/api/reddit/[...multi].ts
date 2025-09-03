import type { NextApiRequest, NextApiResponse } from "next";

//odd searchParams issues, not using edge
// export const config = {
//   runtime: "experimental-edge",
// };

const BASE_ROUTE = "https://oauth.reddit.com/api";

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  const uri = request.url?.split("/api/reddit")?.[1]; //request.nextUrl?.pathname?.split("/api/reddit")?.[1];
  //const search = request.nextUrl.searchParams.toString();
  const method = request.method;
  const auth = request.headers?.["authorization"]; //request.headers?.get("authorization");
  //console.log("R1?", { uri, method, auth });
  if (!uri || !method || !auth) {
    response.status(400).json({ Error: "Missing data" });
  } else {
    try {
      // Prepare headers and body forwarding
      const headers: Record<string, string> = {};
      if (auth) headers['authorization'] = String(auth);
      const ctHeader = request.headers?.['content-type'];
      if (ctHeader) headers['content-type'] = Array.isArray(ctHeader) ? ctHeader[0] : String(ctHeader);

      const needsBody = method !== 'GET' && method !== 'HEAD';
      let body: any = undefined;
      if (needsBody) {
        const ct = typeof headers['content-type'] === 'string' ? headers['content-type'] : '';
        if (typeof request.body === 'string') {
          body = request.body;
        } else if (ct.includes('application/json')) {
          body = JSON.stringify(request.body ?? {});
        } else if (ct.includes('application/x-www-form-urlencoded')) {
          body = new URLSearchParams(request.body ?? {}).toString();
        } else {
          // Fallback: let fetch handle undefined body
          body = undefined;
        }
      }

      const r = await fetch(`${BASE_ROUTE}${uri}`, {
        method,
        headers,
        body,
      });

      try {
        const json = await r.json();
        response.status(r.status).json(json);
      } catch (error) {
        response.status(r.status).json({ Status: r.statusText });
      }
    } catch (err) {
      response.status(500).json({ Error: "Server error" });
    }
  }
  return;
};
export default handler;

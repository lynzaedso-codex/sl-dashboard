// Read-only Lark Bitable client. Every call here is a GET — there is no write
// path in this file, on purpose (see HANDOFF security constraints).

const LARK_HOST = "https://open.larksuite.com";

export async function getTenantAccessToken(env) {
  const resp = await fetch(`${LARK_HOST}/open-apis/auth/v3/tenant_access_token/internal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: env.LARK_APP_ID,
      app_secret: env.LARK_APP_SECRET,
    }),
  });
  const data = await resp.json();
  if (data.code !== 0) {
    throw new Error(`Lark auth failed: ${data.code} ${data.msg}`);
  }
  return data.tenant_access_token;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Codes Lark returns for its own transient hiccups, not real failures:
//   1254607 "Data not ready" — table still indexing server-side
//   1255001 "InternalError"  — Lark's own momentary server error
// Retrying after a short wait clears both; any other code still throws
// after a few attempts instead of hanging forever.
const TRANSIENT_LARK_CODES = new Set([1254607, 1255001]);

async function fetchLarkPage(url, token, tableId, attempts = 4) {
  for (let i = 0; i < attempts; i++) {
    // A raw network failure (timeout, reset, DNS hiccup — e.g. undici's
    // HeadersTimeoutError on a slow/attachment-heavy table) throws before
    // there's any response body to inspect. Retry that the same as Lark's
    // own transient codes below, instead of letting it crash the whole run.
    let resp;
    try {
      resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      if (i === attempts - 1) throw new Error(`Lark list records network failure for table ${tableId}: ${err.message}`);
      await sleep(1000 * (i + 1));
      continue;
    }
    const data = await resp.json();
    if (data.code === 0) return data;
    const isTransient = TRANSIENT_LARK_CODES.has(data.code);
    if (!isTransient || i === attempts - 1) {
      throw new Error(`Lark list records failed for table ${tableId}: ${data.code} ${data.msg}`);
    }
    await sleep(1000 * (i + 1));
  }
}

// Pages through every record in a table (bitable records are capped at
// page_size=500 per call) and returns the flat list of `fields` objects.
export async function listAllRecords(token, appToken, tableId) {
  const records = [];
  let pageToken = "";

  for (;;) {
    const url = new URL(`${LARK_HOST}/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`);
    url.searchParams.set("page_size", "500");
    if (pageToken) url.searchParams.set("page_token", pageToken);

    const data = await fetchLarkPage(url, token, tableId);

    for (const item of data.data.items || []) {
      records.push(item.fields);
    }

    if (!data.data.has_more) break;
    pageToken = data.data.page_token;
  }

  return records;
}

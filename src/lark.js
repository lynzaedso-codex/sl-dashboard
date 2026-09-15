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

// Pages through every record in a table (bitable records are capped at
// page_size=500 per call) and returns the flat list of `fields` objects.
export async function listAllRecords(token, appToken, tableId) {
  const records = [];
  let pageToken = "";

  for (;;) {
    const url = new URL(`${LARK_HOST}/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`);
    url.searchParams.set("page_size", "500");
    if (pageToken) url.searchParams.set("page_token", pageToken);

    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await resp.json();
    if (data.code !== 0) {
      throw new Error(`Lark list records failed for table ${tableId}: ${data.code} ${data.msg}`);
    }

    for (const item of data.data.items || []) {
      records.push(item.fields);
    }

    if (!data.data.has_more) break;
    pageToken = data.data.page_token;
  }

  return records;
}

/**
 * Full spine against live gateway (deploy + canonical/alt/stake/over-quota).
 * Uses compiled TS via dynamic import of Next-friendly modules — run through
 * a small inline re-export by spawning next isn't needed; call the same logic
 * after building with node --import tsx if available. Prefer hitting the API
 * once the Next server is up: curl -X POST http://127.0.0.1:43127/api/diff-demo
 */
const url = process.env.DIFF_URL ?? "http://127.0.0.1:43127/api/diff-demo";
console.log("POST", url);
const res = await fetch(url, { method: "POST" });
const body = await res.json();
console.log(JSON.stringify(body, null, 2));
if (!body.ok) process.exit(1);

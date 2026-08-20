import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../server/app.ts";

test("GET /api/dashboard 返回扁平结构，每个源带 items", async (t) => {
  const app = createApp(async (url) => [
    { title: `fake:${url}`, link: "https://example.com", date: "2026-01-01T00:00:00Z" },
  ]);
  const server = app.listen(0);
  t.after(() => server.close());

  const { port } = server.address() as { port: number };
  const res = await fetch(`http://127.0.0.1:${port}/api/dashboard`);
  assert.equal(res.status, 200);

  const body = await res.json();
  assert.ok(body.fetchedAt);
  assert.equal(body.github.length, 2);
  assert.ok(body.news.length >= 4);
  for (const s of [...body.github, ...body.news]) {
    assert.ok(s.source);
    assert.ok(!("ok" in s), "不应存在 {ok,data} 包装层");
    assert.ok(Array.isArray(s.items) && s.items.length > 0);
  }
});

test("单个源失败时返回 error，不影响其他源", async (t) => {
  let calls = 0;
  const app = createApp(async () => {
    calls += 1;
    if (calls === 1) throw new Error("boom");
    return [{ title: "ok", link: "https://example.com", date: null }];
  });
  const server = app.listen(0);
  t.after(() => server.close());

  const { port } = server.address() as { port: number };
  const body = await (await fetch(`http://127.0.0.1:${port}/api/dashboard`)).json();

  assert.equal(body.github[0].error, "Error: boom");
  assert.equal(body.github[1].items.length, 1);
  assert.equal(body.news[0].items.length, 1);
});

import express from "express";
import Parser from "rss-parser";
import { repos, feeds } from "./config.js";

const app = express();
const parser = new Parser();

async function parse(url: string, max: number) {
  const feed = await parser.parseURL(url);
  return feed.items.slice(0, max).map((i) => ({
    title: i.title,
    link: i.link,
    date: i.isoDate ?? null,
  }));
}

async function safe(fn: () => Promise<unknown>) {
  try {
    return { ok: true as const, data: await fn() };
  } catch (err) {
    return { ok: false as const, error: String(err) };
  }
}

app.get("/api/dashboard", async (_req, res) => {
  const [github, news] = await Promise.all([
    Promise.all(
      repos.map((repo) =>
        safe(async () => {
          const [owner, name] = repo.split("/");
          return { source: repo, items: await parse(`https://github.com/${owner}/${name}/releases.atom`, 5) };
        })
      )
    ),
    Promise.all(
      feeds.map((f) =>
        safe(async () => ({ source: f.name, items: await parse(f.url, 8) }))
      )
    ),
  ]);
  res.json({ fetchedAt: new Date().toISOString(), github, news });
});

app.listen(3000, () => console.log("workbench api on http://localhost:3000"));

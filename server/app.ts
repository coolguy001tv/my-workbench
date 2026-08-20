import express from "express";
import Parser from "rss-parser";
import { repos, feeds } from "./config.ts";

export type FeedItem = { title?: string; link?: string; date?: string | null };
export type FeedSource = { source: string; items?: FeedItem[]; error?: string };

const parser = new Parser();

export async function parseFeed(url: string, max: number): Promise<FeedItem[]> {
  const feed = await parser.parseURL(url);
  return feed.items.slice(0, max).map((i) => ({
    title: i.title,
    link: i.link,
    date: i.isoDate ?? null,
  }));
}

export function createApp(fetchFeed = parseFeed) {
  const app = express();

  app.get("/api/dashboard", async (_req, res) => {
    const [github, news] = await Promise.all([
      Promise.all(
        repos.map(async (repo): Promise<FeedSource> => {
          try {
            const [owner, name] = repo.split("/");
            return { source: repo, items: await fetchFeed(`https://github.com/${owner}/${name}/releases.atom`, 5) };
          } catch (err) {
            return { source: repo, error: String(err) };
          }
        })
      ),
      Promise.all(
        feeds.map(async (f): Promise<FeedSource> => {
          try {
            return { source: f.name, items: await fetchFeed(f.url, 8) };
          } catch (err) {
            return { source: f.name, error: String(err) };
          }
        })
      ),
    ]);
    res.json({ fetchedAt: new Date().toISOString(), github, news });
  });

  return app;
}

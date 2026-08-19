import { useEffect, useState } from "react";

const REFRESH_MS = 10 * 60 * 1000;

type Item = { title?: string; link?: string; date?: string | null };
type Source = { source: string; items?: Item[]; error?: string };
type Dashboard = { fetchedAt: string; github: Source[]; news: Source[] };

function timeAgo(date?: string | null) {
  if (!date) return "";
  const ms = Date.now() - new Date(date).getTime();
  if (ms < 60_000) return "刚刚";
  const m = Math.round(ms / 60_000);
  if (m < 60) return `${m} 分钟前`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} 小时前`;
  return `${Math.round(h / 24)} 天前`;
}

function Card({ title, accent, sources }: { title: string; accent: string; sources: Source[] }) {
  const items = sources.flatMap((s) =>
    s.items?.map((i) => ({ ...i, source: s.source })) ?? []
  );
  return (
    <section className="card">
      <h2>
        <span className="dot" style={{ background: accent }} />
        {title}
        <span className="badge">{items.length}</span>
      </h2>
      <ul className="items">
        {items.map((i, idx) => (
          <li key={idx} className="item">
            <a className="title" href={i.link} target="_blank" rel="noreferrer">
              {i.title}
            </a>
            <div className="from">
              {i.source} · {timeAgo(i.date)}
            </div>
          </li>
        ))}
        {sources.filter((s) => s.error).map((s) => (
          <li key={s.source} className="item">
            <span className="title err">{s.source} 加载失败</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function App() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState(false);

  async function refresh() {
    try {
      const res = await fetch("/api/dashboard");
      setData(await res.json());
      setError(false);
    } catch {
      setError(true);
    }
  }

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="page">
      <header className="header">
        <h1>Workbench</h1>
        <span className="meta">
          {error ? "加载失败" : data ? `更新于 ${new Date(data.fetchedAt).toLocaleTimeString("zh-CN")}` : "加载中…"}
        </span>
        <button className="btn" onClick={refresh}>刷新</button>
      </header>
      <div className="grid">
        <Card title="发布动态" accent="#3fb950" sources={data?.github ?? []} />
        <Card title="AI 新闻" accent="#b18cff" sources={data?.news ?? []} />
      </div>
    </div>
  );
}

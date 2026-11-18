"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "dj-ankieta-zaglosowane";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [hidden, setHidden] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [voted, setVoted] = useState([]);
  const [sending, setSending] = useState("");
  const [active, setActive] = useState(null); // null = jeszcze sprawdzamy
  const [round, setRound] = useState("0");

  // Czy szafa jest teraz włączona? Przy okazji sprawdzamy "rundę" głosowania:
  // po wyczyszczeniu głosów w panelu zaczyna się nowa runda i pamięć ✔ się zeruje.
  useEffect(() => {
    fetch("/api/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const r = String(d.round || "0");
        setRound(r);
        try {
          const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
          if (saved && saved.round === r && Array.isArray(saved.ids)) setVoted(saved.ids);
          else localStorage.removeItem(STORAGE_KEY);
        } catch {}
        setActive(d.active === true);
      })
      .catch(() => setActive(false));
  }, []);

  async function search(e) {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Coś poszło nie tak.");
      setResults(data.results);
      setHidden(data.hidden || 0);
      setSearched(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function vote(item) {
    setSending(item.trackId);
    setError("");
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Nie udało się zagłosować.");
      const next = [...voted, item.trackId];
      setVoted(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ round, ids: next }));
      } catch {}
    } catch (err) {
      setError(err.message);
    } finally {
      setSending("");
    }
  }

  const bulbs = (off) => (
    <div className={"bulbs" + (off ? " off" : "")} aria-hidden="true">
      {Array.from({ length: 11 }).map((_, i) => (
        <span key={i} className="bulb" />
      ))}
    </div>
  );

  const footer = (
    <footer className="py-5 text-center text-xs text-amber-100/60">
      Dane utworów i okładki: Spotify
    </footer>
  );

  if (active === false) {
    return (
      <div className="flex min-h-screen flex-col px-3 py-6">
        <div className="cabinet dark-machine">
          <div className="cabinet-inner text-center">
            <h1 className="neon-title">Szafa grająca</h1>
            <p className="neon-sub">jukebox</p>
            {bulbs(true)}
            <div className="display mt-2">
              <p className="display-label">STATUS</p>
              <p className="py-6">
                <span className="coin-lamp">NIECZYNNE</span>
              </p>
              <p className="pb-2 text-sm text-emerald-200/70">
                Szafa odpoczywa. Wróć na następną imprezę!
              </p>
            </div>
          </div>
        </div>
        <div className="flex-1" />
        {footer}
      </div>
    );
  }

  if (active === null) {
    return <div className="min-h-screen" />;
  }

  return (
    <div className="flex min-h-screen flex-col px-3 py-6">
      <div className="cabinet">
        <div className="cabinet-inner">
          <h1 className="neon-title">Szafa grająca</h1>
          <p className="neon-sub">Co ma zagrać DJ?</p>
          {bulbs(false)}

          <form onSubmit={search} className="display">
            <p className="display-label">▶ WPISZ TYTUŁ LUB WYKONAWCĘ</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="np. Dua Lipa Houdini"
                maxLength={100}
                aria-label="Szukaj piosenki"
              />
              <button type="submit" disabled={loading} className="chrome-btn flex-none">
                {loading ? "…" : "Szukaj"}
              </button>
            </div>
          </form>

          {error && (
            <p className="mt-4 rounded-lg border-2 border-red-300 bg-red-100 px-4 py-3 text-red-800">
              {error}
            </p>
          )}

          <ul className="mt-5 space-y-3">
            {results.map((r, i) => {
              const done = voted.includes(r.trackId);
              const busy = sending === r.trackId;
              return (
                <li key={r.trackId} className="slot" style={{ animationDelay: i * 40 + "ms" }}>
                  <span className="slot-num">{String(i + 1).padStart(2, "0")}</span>
                  <div className={"vinyl" + (busy ? " busy" : "")}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.cover} alt="" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 font-bold leading-snug">
                      {r.title}
                      {r.explicit && (
                        <span className="ml-2 rounded bg-slate-700 px-1.5 py-0.5 align-middle text-xs text-white">
                          E
                        </span>
                      )}
                    </p>
                    <p className="truncate text-sm text-amber-900/80">{r.artist}</p>
                    {r.url && (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-800 underline"
                      >
                        Posłuchaj w Spotify
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => vote(r)}
                    disabled={done || busy}
                    className={"chrome-btn flex-none text-sm " + (done ? "done" : "pink")}
                  >
                    {done ? "✔ Jest" : busy ? "…" : "Zagłosuj"}
                  </button>
                </li>
              );
            })}
          </ul>

          {hidden > 0 && (
            <p className="mt-4 text-center text-sm text-amber-100/80">
              Ukryto {hidden} {hidden === 1 ? "utwór" : "utwory"} z wulgarnymi tekstami.
            </p>
          )}

          {searched && !loading && results.length === 0 && !error && (
            <p className="mt-6 text-center text-amber-100">
              Nic nie znaleziono. Spróbuj innych słów.
            </p>
          )}

          {!searched && (
            <p className="mt-5 text-center text-sm text-amber-100/70">
              Znajdź piosenkę, wciśnij guzik „Zagłosuj” i gotowe!
            </p>
          )}
        </div>
      </div>
      <div className="flex-1" />
      {footer}
    </div>
  );
}

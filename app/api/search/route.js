import { NextResponse } from "next/server";
import { getSupabase, getSettings } from "../../../lib/supabase";
import { searchTracks } from "../../../lib/spotify";

// Wyniki trzymamy 24 godziny. To samo hasło = brak zapytania do Spotify.
const TTL_MS = 24 * 60 * 60 * 1000;
const memory = new Map(); // szybka pamięć w obrębie jednej instancji serwera

function norm(text = "") {
  return text
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Spotify często zwraca ten sam utwór z singla, albumu i kompilacji
function dedupe(list) {
  const seen = new Set();
  return list.filter((t) => {
    const key = `${norm(t.title)}|${norm(t.artist.split(",")[0])}|${t.explicit}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function reply(full, hideExplicit) {
  const visible = hideExplicit ? full.filter((t) => !t.explicit) : full;
  const hidden = full.length - visible.length;
  return NextResponse.json(
    { results: dedupe(visible), hidden },
    // Wynik zależy od ustawień z panelu DJ-a, więc nie wolno go trzymać w pamięci przeglądarek ani sieci
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET(request) {
  const raw = new URL(request.url).searchParams.get("q") || "";
  const q = raw.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 100);
  if (q.length < 2) {
    return NextResponse.json({ error: "Wpisz co najmniej 2 znaki." }, { status: 400 });
  }

  const settings = await getSettings();
  // Szafa wyłączona = nie ruszamy ani Spotify, ani bazy wyników
  if (!settings.active) {
    return NextResponse.json({ error: "Szafa grająca jest teraz wyłączona." }, { status: 403 });
  }

  const cacheKey = "sp:" + q;

  // 1) pamięć serwera
  const hit = memory.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL_MS) return reply(hit.results, settings.hideExplicit);

  // 2) pamięć w bazie (wspólna dla wszystkich instancji)
  try {
    const { data } = await getSupabase()
      .from("search_cache")
      .select("results, created_at")
      .eq("query", cacheKey)
      .maybeSingle();
    if (data && Date.now() - new Date(data.created_at).getTime() < TTL_MS) {
      memory.set(cacheKey, { at: Date.now(), results: data.results });
      return reply(data.results, settings.hideExplicit);
    }
  } catch {
    // brak cache nie może zepsuć wyszukiwania
  }

  // 3) dopiero teraz pytamy Spotify
  let results;
  try {
    results = await searchTracks(q);
  } catch (err) {
    console.error("BŁĄD WYSZUKIWANIA SPOTIFY:", err);
    return NextResponse.json(
      { error: "Wyszukiwarka chwilowo nie działa. Spróbuj za chwilę." },
      { status: 502 }
    );
  }

  memory.set(cacheKey, { at: Date.now(), results });
  try {
    await getSupabase()
      .from("search_cache")
      .upsert({ query: cacheKey, results, created_at: new Date().toISOString() });
  } catch {}

  return reply(results, settings.hideExplicit);
}

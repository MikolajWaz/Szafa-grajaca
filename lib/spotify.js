// Wyszukiwanie utworów w Spotify (logowanie samej aplikacji, goście niczego nie wpisują).
let cached = { token: null, exp: 0 };

async function getToken(force = false) {
  if (!force && cached.token && Date.now() < cached.exp - 60_000) return cached.token;
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Brak SPOTIFY_CLIENT_ID lub SPOTIFY_CLIENT_SECRET na serwerze.");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Spotify odrzucił logowanie aplikacji.");
  const json = await res.json();
  cached = { token: json.access_token, exp: Date.now() + json.expires_in * 1000 };
  return cached.token;
}

// najmniejsza okładka o szerokości co najmniej 150 px
function pickCover(images = []) {
  const sorted = [...images].sort((a, b) => (a.width || 0) - (b.width || 0));
  return (sorted.find((i) => (i.width || 0) >= 150) || sorted[sorted.length - 1] || {}).url || "";
}

export async function searchTracks(q) {
  const params = new URLSearchParams({ q, type: "track", limit: "10", market: "PL" });
  let token = await getToken();
  let res = await fetch(`https://api.spotify.com/v1/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 401) {
    token = await getToken(true); // token mógł wygasnąć wcześniej niż zakładaliśmy
    res = await fetch(`https://api.spotify.com/v1/search?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  }
  if (!res.ok) throw new Error(`Spotify odpowiedział błędem ${res.status}`);
  const json = await res.json();
  return (json.tracks?.items || []).filter(Boolean).map((t) => ({
    trackId: t.id,
    title: t.name,
    artist: (t.artists || []).map((a) => a.name).join(", "),
    cover: pickCover(t.album?.images),
    explicit: !!t.explicit,
    url: t.external_urls?.spotify || "",
  }));
}

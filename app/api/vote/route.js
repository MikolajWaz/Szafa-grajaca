import { NextResponse } from "next/server";
import { getSupabase, getSettings } from "../../../lib/supabase";

export async function POST(request) {
  const settings = await getSettings();
  if (!settings.active) {
    return NextResponse.json({ error: "Szafa grająca jest teraz wyłączona." }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe dane." }, { status: 400 });
  }

  const { trackId, title, artist, cover, explicit, url } = body || {};

  // Prosta kontrola, żeby do bazy nie trafiały śmieci
  if (typeof trackId !== "string" || !/^[A-Za-z0-9]{22}$/.test(trackId)) {
    return NextResponse.json({ error: "Nieprawidłowy utwór." }, { status: 400 });
  }
  if (typeof title !== "string" || title.length === 0 || title.length > 300) {
    return NextResponse.json({ error: "Nieprawidłowy tytuł." }, { status: 400 });
  }
  if (settings.hideExplicit && explicit === true) {
    return NextResponse.json({ error: "Ten utwór jest niedostępny." }, { status: 403 });
  }

  try {
    const { error } = await getSupabase()
      .from("votes")
      .insert({
        video_id: trackId, // dla głosów ze Spotify to identyfikator utworu w Spotify
        source: "spotify",
        title: title.slice(0, 300),
        artist: typeof artist === "string" ? artist.slice(0, 300) : null,
        thumbnail_url: typeof cover === "string" && cover.startsWith("https://") ? cover.slice(0, 500) : null,
        explicit: explicit === true,
        spotify_url:
          typeof url === "string" && url.startsWith("https://open.spotify.com/") ? url.slice(0, 200) : null,
      });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("BŁĄD ZAPISU GŁOSU:", err);
    return NextResponse.json({ error: "Nie udało się zapisać głosu." }, { status: 500 });
  }
}

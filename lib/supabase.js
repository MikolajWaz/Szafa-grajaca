import { createClient } from "@supabase/supabase-js";

// Klient bazy używany wyłącznie po stronie serwera (pliki w app/api).
// Klucz service_role nigdy nie trafia do przeglądarki.
let client = null;

export function getSupabase() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Brak SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY w ustawieniach.");
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

// Ustawienia przełączane z panelu DJ-a (tabela settings).
// Przy braku danych bezpieczniej jest uznać szafę za wyłączoną, a utwory explicit za ukryte.
export async function getSettings() {
  const settings = { active: false, hideExplicit: true, round: "0" };
  try {
    const { data, error } = await getSupabase()
      .from("settings")
      .select("key, value")
      .in("key", ["active", "hide_explicit", "round"]);
    if (error || !data) return settings;
    for (const row of data) {
      if (row.key === "active") settings.active = row.value === "true";
      if (row.key === "round") settings.round = String(row.value || "0");
      if (row.key === "hide_explicit") settings.hideExplicit = row.value !== "false";
    }
  } catch {
    // zostają wartości bezpieczne
  }
  return settings;
}

export async function isActive() {
  return (await getSettings()).active;
}

# Music Radar – Entscheidungen und Regeln (v3)

Stand: 2026-11-08. Diese Datei ist das verbindliche Projektwissen für Lovable.
Sie ersetzt alle älteren Anleitungen (v2.0, P-/N-Prompts). Bei Widerspruch gilt diese Datei.

## 1. Was gebaut wird

Private mobile Web-App für genau zwei Nutzer (Handy A, Handy B):

- Beide melden sich mit eigenem App-Konto an und verbinden jeweils ihr eigenes Spotify-Konto.
- Beide teilen nach ausdrücklicher Freigabe ihren Live-Standort und sehen sich auf einer Karte.
- Am Marker des Partners stehen der aktuell laufende Spotify-Titel und das Datenalter.
- Tippen auf den Marker öffnet das Profil: Alias, Bio, selbst gewählte Genres, optional Spotify-Top-Künstler.
- Like / Pass; zwei Likes ergeben genau ein Match.

Das ist ein technischer Prototyp und Lernprojekt, kein Produkt für Dritte.

## 2. Projektregeln für Lovable

1. Backend ist das verbundene eigene Supabase-Projekt. Kein Lovable Cloud, keine zweite Datenhaltung.
2. Jede Tabelle hat RLS. Policies nutzen `auth.uid()`. Keine Policy mit `using (true)`.
3. Secrets (Spotify Client Secret, Service Role Key) nur in Edge Functions, nie im Frontend, nie in Logs.
4. Keine Demo-Daten, keine erfundenen Nutzer, kein Dummy-Login, kein simulierter Provider-Status.
5. Browser-APIs (Mapbox, Geolocation) nur clientseitig laden (TanStack Start rendert serverseitig).
6. Ein Prompt, ein Feature. Nach jedem Auftrag: geänderte Dateien, ausgeführte Prüfungen, nächster manueller Test.
7. Datenbankänderungen als versionierte Migration; SQL vor Ausführung anzeigen.
8. Nicht implementierte Funktionen ehrlich als offen kennzeichnen. Nichts als fertig melden, nur weil UI existiert.
9. Keine Reparatur durch Abschalten von RLS, Auth oder `verify_jwt` auf Fach-Funktionen.
10. UI auf Deutsch, mobile first.

## 3. Getroffene Entscheidungen

| Frage | Entscheidung | Begründung |
| --- | --- | --- |
| Nutzer | Zwei Konten, im Supabase-Dashboard angelegt; Registrierung aus | Keine Einladungslogik nötig |
| Paarbildung | Fester Eintrag in Tabelle `pairs` (von Hand per SQL) | Zwei Personen brauchen keinen Code-Flow |
| Backend | Eigenes Supabase-Projekt | SQL-Editor, Logs und Auth-Dashboard sind der Lernort |
| Frontend | Lovable-Standard (TanStack Start) | Kein Frameworkwechsel |
| Karte | Mapbox GL JS, Public Token mit URL-Beschränkung | Free Tier reicht für zwei Nutzer |
| Standort | Browser-Geolocation im Vordergrund, Upsert in `presence`, Polling alle 5 s, TTL 60 s | Einfach nachvollziehbar; Realtime später |
| Musikdienst | Nur Spotify, Development Mode, beide Konten in der Allowlist | Dev Mode erlaubt 5 Nutzer; `/me/player/currently-playing` und `/me/top/artists` verfügbar |
| Spotify-Tokens | Private Tabelle ohne Client-Policies; nur Edge Functions lesen | Verschlüsselung im Code ist Härtung für später |
| Genres | Manuell aus fester Liste; als "selbst gewählt" gekennzeichnet | Spotify hat keinen Favoriten-Genre-Endpunkt |
| Top-Künstler | Unverändert angezeigt, nichts daraus berechnet | Kein Score, kein Taste-Match (Spotify-Policy III.13) |
| Match | Postgres-Funktion `submit_swipe` mit Transaktion und Unique Constraint | Race Condition gehört in die Datenbank |
| Veröffentlichung | Lovable Publish, Link auf beiden Handys, Homescreen-Verknüpfung | Reicht für den Zwei-Personen-Test |

## 4. Nicht im Umfang (Parkplatz)

Apple Music, native App (Capacitor), Hintergrund-Ortung, Einladungscodes, Token-Verschlüsselung im Code,
Rate-Limits, Cron-Cleanup, Blockieren/Melden/Unmatch, Konto-Export, CI/CD, getrennte Production.
Jedes Thema hat einen Auslöser (erster Fremdnutzer, zweiter Musikdienst, Store-Wunsch). Vorher nicht bauen.

## 5. Datenmodell

Alle Tabellen im Schema `public`, RLS aktiv. `user_id` verweist immer auf `auth.users(id) on delete cascade`.

### profiles (Lektion 3, erweitert in Lektion 8)

| Spalte | Typ | Hinweis |
| --- | --- | --- |
| id | uuid, PK | = auth.users.id |
| alias | text | Pflicht, max. 30 Zeichen |
| bio | text | optional, max. 200 Zeichen |
| genres | text[] | aus fester Liste, Herkunft immer "manuell" |
| top_artists | jsonb | Array aus {name, url}; Import aus Spotify (Lektion 8) |
| top_artists_imported_at | timestamptz | null, solange nicht importiert |
| show_top_artists | boolean | default false |
| created_at | timestamptz | default now() |

RLS: eigene Zeile lesen und schreiben (`auth.uid() = id`). Fremdes Profil nur über Edge Function `partner-profile`.

### pairs (Lektion 3, Consent in Lektion 5)

| Spalte | Typ | Hinweis |
| --- | --- | --- |
| id | uuid, PK | default gen_random_uuid() |
| user_a | uuid | FK auth.users |
| user_b | uuid | FK auth.users |
| consent_a | boolean | default false; nur user_a darf setzen |
| consent_b | boolean | default false; nur user_b darf setzen |
| created_at | timestamptz | default now() |

RLS: lesen, wenn `auth.uid() in (user_a, user_b)`. Update nur auf das eigene consent-Feld (Policy mit `with check`, die das andere Feld unverändert verlangt, oder eine RPC `set_consent(boolean)`).
Der Paar-Eintrag wird einmal von Hand per SQL angelegt.

### presence (Lektion 5)

| Spalte | Typ | Hinweis |
| --- | --- | --- |
| user_id | uuid, PK | eine Zeile pro Nutzer |
| lat | double precision | |
| lng | double precision | |
| accuracy_m | real | aus position.coords.accuracy |
| observed_at | timestamptz | Gerätezeit des GPS-Fixes (position.timestamp), nicht Date.now() |
| updated_at | timestamptz | Serverzeit, default now(), per Trigger bei Update setzen |

RLS: eigene Zeile insert/update/delete (`auth.uid() = user_id`). Kein Select für Clients; lesen nur über Edge Function `nearby`.
Frischeregel in `nearby`: `updated_at` jünger als 60 s, sonst null.

### current_media (Lektion 7)

| Spalte | Typ | Hinweis |
| --- | --- | --- |
| user_id | uuid, PK | |
| provider | text | vorerst immer "spotify" |
| state | text | playing, paused, none |
| title | text | null bei none |
| artist | text | null bei none |
| url | text | Spotify-Link, nur https://open.spotify.com/... |
| observed_at | timestamptz | Serverzeit der erfolgreichen API-Antwort |

RLS: keine Client-Policies. Schreiben nur durch `spotify-sync` (Service Role), lesen nur durch `nearby`.
Frischeregel: `observed_at` jünger als 90 s, sonst nicht ausgeben. Eigene Uhr, unabhängig von presence.

### provider_tokens (Lektion 6)

| Spalte | Typ | Hinweis |
| --- | --- | --- |
| user_id | uuid, PK | |
| provider | text | "spotify" |
| access_token | text | |
| refresh_token | text | |
| expires_at | timestamptz | |
| scopes | text | Leerzeichen-getrennt, wie von Spotify geliefert |
| provider_account_id | text | Spotify-User-ID aus /me, zur Anzeige "verbunden als" |
| updated_at | timestamptz | |

RLS: keine Client-Policies. Nur Edge Functions. Disconnect löscht die Zeile und den Eintrag in current_media.

### oauth_states (Lektion 6)

| Spalte | Typ | Hinweis |
| --- | --- | --- |
| state | text, PK | zufällig, mind. 32 Byte Base64url |
| user_id | uuid | |
| created_at | timestamptz | default now(); gültig 10 Minuten |

RLS: keine Client-Policies. `spotify-callback` löscht den State beim Verbrauch (einmalig).

### swipes (Lektion 9)

| Spalte | Typ | Hinweis |
| --- | --- | --- |
| from_user | uuid | |
| to_user | uuid | |
| decision | text | like oder pass |
| created_at | timestamptz | |

Unique (from_user, to_user). RLS: eigene Zeile lesen; schreiben nur über die Funktion `submit_swipe`.

### matches (Lektion 9)

| Spalte | Typ | Hinweis |
| --- | --- | --- |
| user_low | uuid | kleinere UUID |
| user_high | uuid | größere UUID |
| created_at | timestamptz | |

Unique (user_low, user_high). RLS: lesen, wenn beteiligt. Keine Client-Policy zum Schreiben; nur `submit_swipe` (SECURITY DEFINER, `set search_path = public`) legt Matches an, `on conflict do nothing`.

## 6. Edge Functions

| Funktion | JWT | Aufgabe |
| --- | --- | --- |
| nearby | ja | Paar + beidseitiger Consent prüfen, presence (≤ 60 s) und current_media (≤ 90 s) des Partners liefern |
| partner-profile | ja | Paar prüfen, Alias/Bio/Genres liefern, Top-Künstler nur bei show_top_artists |
| spotify-connect | ja | state erzeugen und speichern, Spotify-Login-URL zurückgeben |
| spotify-callback | nein (verify_jwt = false) | state prüfen und verbrauchen, code gegen Tokens tauschen, speichern, Redirect zu APP_URL/profile?spotify=ok oder =error |
| provider-status | ja | ob Spotify verbunden ist, verbunden als welches Konto |
| spotify-sync | ja | Token ggf. refreshen, /me/player/currently-playing abfragen, current_media schreiben; 204 = none, 401 = Tokens löschen, 429 = Retry-After zurückgeben |
| spotify-top-artists | ja | /me/top/artists (medium_term, limit 10) in profiles.top_artists schreiben |

Nutzeridentität in jeder Funktion ausschließlich aus `auth.getUser(token)`; nie aus dem Request-Body.

## 7. Konfiguration

Öffentlich (Frontend): Supabase URL, Supabase Publishable Key, Mapbox Public Token.
Edge-Function-Secrets: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI, APP_URL.
Spotify-Scopes: `user-read-currently-playing user-top-read`.
Redirect URI: `https://<PROJECT_REF>.supabase.co/functions/v1/spotify-callback`.

## 8. Testgeräte

| Gerät | Modell | OS-Version | Browser |
| --- | --- | --- | --- |
| Handy A | | | |
| Handy B | | | |

## 9. Timing-Regeln auf einen Blick

| Signal | Sender | Frische-Grenze |
| --- | --- | --- |
| GPS → presence | bei Bewegung, max. alle 5 s | 60 s (updated_at) |
| nearby-Poll | alle 5 s, nur bei sichtbarer Karte, keine überlappenden Requests | – |
| spotify-sync | alle 30 s, nur solange live | 90 s (observed_at) |
| oauth state | – | 10 min |

# Anmeldung

## Datenmodell
- [x] Spaltenvorgaben aus docs/decisions.md erhalten.
- [ ] SQL für profiles, pairs, presence und current_media mit RLS zur Prüfung zeigen, danach Migration ausführen.
- [ ] Automatische Anlage fehlender eigener Profile beim ersten Login implementieren und testen; Oberfläche unverändert lassen.

## Bestehende Anmeldung

- [x] E-Mail/Passwort-Anmeldung und geschützte Seiten
- [x] Private Profildaten und Abmeldung
- [x] Automatische Tests und Prüfung der Weiterleitungen ohne Anmeldung
- [ ] Echter Login, Neuladen und Logout: automatische angemeldete Prüfung beim externen Supabase nicht verfügbar; manuelle Prüfung mit bestehendem Konto erforderlich.
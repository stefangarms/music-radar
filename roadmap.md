# Anmeldung

## Datenmodell
- [x] Spaltenvorgaben aus docs/decisions.md erhalten.
- [x] SQL für profiles, pairs, presence und current_media mit RLS zur Prüfung gezeigt; freigegebene Migration und ergänzende Rechte-Einschränkung ausgeführt.
- [x] Automatische Anlage fehlender eigener Profile bei erfolgreichem Login implementiert; Schema, Policies, Rechte und Trigger zurückgelesen; 28 SQL-Vertrags-/Auth-/Routingtests erfolgreich; Oberfläche unverändert.
- [ ] Echte Anmeldung mit fehlender Profilzeile und RLS-Zugriffe beider bestehenden Konten prüfen: externe Supabase-Anmeldesitzung und transaktionale Datenbanktests hier nicht verfügbar; bestehende Profile wurden nicht gelöscht und keine Dummy-Nutzer angelegt.

## Bestehende Anmeldung

- [x] E-Mail/Passwort-Anmeldung und geschützte Seiten
- [x] Private Profildaten und Abmeldung
- [x] Automatische Tests und Prüfung der Weiterleitungen ohne Anmeldung
- [ ] Echter Login, Neuladen und Logout: automatische angemeldete Prüfung beim externen Supabase nicht verfügbar; manuelle Prüfung mit bestehendem Konto erforderlich.
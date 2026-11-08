import { supabase } from "@/integrations/supabase/client";

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) {
    if (error.code === "invalid_credentials") throw new Error("E-Mail oder Passwort ist falsch.");
    if (error.code === "email_not_confirmed") throw new Error("Deine E-Mail-Adresse ist noch nicht bestätigt.");
    throw new Error("Die Anmeldung ist derzeit nicht möglich. Bitte versuche es erneut.");
  }
  if (!data.session) throw new Error("Die Anmeldung konnte nicht abgeschlossen werden.");
  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error("Abmelden ist derzeit nicht möglich. Bitte versuche es erneut.");
}

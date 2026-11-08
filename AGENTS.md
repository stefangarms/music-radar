<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Private content routes live under the client-only `_authenticated` layout, which validates Supabase users and redirects to `/login`; navigation lives inside that layout to avoid exposing a signed-out shell.
- Keep one root Supabase identity-change subscription; clear Query caches on sign-out to prevent protected data surviving sessions.
- Profiles are provisioned idempotently by app-owned Auth signup and successful-login lifecycle triggers, with owner-only access; never seed users or profiles from page loads, so missing profiles recover without client provisioning.
- Application user foreign keys reference public.profiles with cascading deletion; only profiles references auth.users, keeping app-owned relationships separate from managed Auth tables.
- Preserve existing profile columns when adding the documented model so database-only changes do not break the unchanged UI.

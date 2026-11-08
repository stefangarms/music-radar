import { useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

type Props = { title: string; emptyText: string; icon: ReactNode };

/** Platzhalter-Screen: zeigt kurz einen Ladezustand, danach den Leerzustand. */
export function ScreenState({ title, emptyText, icon }: Props) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-24 pt-8">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-muted-foreground" role="status">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm">Wird geladen …</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-primary">
              {icon}
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">{emptyText}</p>
          </div>
        )}
      </div>
    </main>
  );
}

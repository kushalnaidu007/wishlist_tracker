import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SetupNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-lg border-dashed">
        <CardHeader>
          <CardTitle className="font-heading text-lg tracking-tight">
            Connect Supabase to continue
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            This app is built and ready — it just needs a Supabase project to
            store data in. Copy{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-foreground">
              .env.local.example
            </code>{" "}
            to{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-foreground">
              .env.local
            </code>{" "}
            and fill in your project&apos;s URL and anon key from{" "}
            <span className="text-foreground">
              Project Settings → API
            </span>{" "}
            in the Supabase dashboard.
          </p>
          <p>
            Then run the migration at{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-foreground">
              supabase/migrations/0001_init.sql
            </code>{" "}
            against your project (SQL Editor, or{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-foreground">
              supabase db push
            </code>{" "}
            with the CLI) and restart the dev server.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

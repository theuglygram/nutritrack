import { APP_NAME, APP_TAGLINE } from "@nutritrack/core";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight">{APP_NAME}</h1>
      <p className="max-w-md text-lg leading-8 text-muted-foreground">{APP_TAGLINE}</p>
    </main>
  );
}

export const dynamic = "force-dynamic";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function getBackendStatus(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

export default async function HomePage() {
  const backendOk = await getBackendStatus();

  return (
    <main>
      <h1>WellMind</h1>
      <p className="muted">
        Plateforme de retours d&apos;expérience au travail et d&apos;amélioration continue.
      </p>
      <p>
        Backend :{" "}
        <strong className={backendOk ? "ok" : "ko"}>{backendOk ? "disponible" : "indisponible"}</strong>
      </p>
    </main>
  );
}

export default function Dashboard() {
  return (
    <div className="py-16">
      <div className="container mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Authentication is disabled in this build. We will wire up real user
          accounts after the ledger MVP is in place.
        </p>
      </div>
    </div>
  );
}

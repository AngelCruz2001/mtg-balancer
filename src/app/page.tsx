import DeckLoaderPanel from "@/components/deck-loader/DeckLoaderPanel";

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-foreground">MTG Deck Balancer</h1>
      <DeckLoaderPanel />
    </main>
  );
}

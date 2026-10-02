import { constructMetadata } from "@/lib/metadata";
import { WatchlistClient } from "@/components/watchlist/WatchlistClient";

export const runtime = "edge";

export const metadata = constructMetadata({
  title: "Your Watchlist | a1score",
  description: "Track market valuation changes for your favorite football players and clubs.",
  path: "/watchlist",
});

export default function WatchlistPage() {
  return (
    <div className="w-full">
      <WatchlistClient />
    </div>
  );
}

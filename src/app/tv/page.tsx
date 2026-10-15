import { constructMetadata } from "@/lib/metadata";
import { tvProvider } from "@/lib/tv";
import { isTvCountry, tvCountryName } from "@/lib/tv/countries";
import { TvScheduleClient } from "@/components/tv/TvScheduleClient";
import { TvCountryRedirect } from "@/components/tv/TvCountryRedirect";

export const runtime = "edge";

interface TvPageProps {
  searchParams: { country?: string };
}

export function generateMetadata({ searchParams }: TvPageProps) {
  const code = searchParams.country?.toUpperCase();
  const where = isTvCountry(code) ? ` in ${tvCountryName(code)}` : "";
  return constructMetadata({
    title: `Football on TV${where} | a1score`,
    description: `Which channel is showing the match${where}: upcoming football TV and streaming schedules.`,
    path: "/tv",
    // Listings come from an unofficial source for now; keep them out of search results.
    noIndex: true,
  });
}

export default async function TvPage({ searchParams }: TvPageProps) {
  const code = searchParams.country?.toUpperCase();
  if (!isTvCountry(code)) return <TvCountryRedirect />;

  let unavailable = false;
  const listings = await tvProvider.getListings(code).catch((err) => {
    console.warn("[tv] listings unavailable:", err instanceof Error ? err.message : err);
    unavailable = true;
    return [];
  });

  return (
    <TvScheduleClient
      key={code}
      country={code}
      listings={listings}
      sourceLabel={tvProvider.sourceLabel}
      unavailable={unavailable}
    />
  );
}

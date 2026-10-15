import { constructMetadata } from "@/lib/metadata";
import { MORE_ACCOUNT, MORE_FEATURES } from "@/lib/nav/config";
import { NAV_ICONS } from "@/components/shell/navIcons";
import { MenuGroup, MenuRow } from "@/components/more/MenuRow";
import { TvCountryLabel } from "@/components/tv/TvCountryLabel";
import { AccountCard } from "@/components/auth/AccountCard";

export const runtime = "edge";

export const metadata = constructMetadata({
  title: "More | a1score",
  description: "Market values, Transfer Centre, player comparison, notifications and settings.",
  path: "/more",
});

export default function MorePage() {
  return (
    <div className="max-w-[720px] mx-auto space-y-6 pb-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] px-1">More</h1>

      <AccountCard />

      <MenuGroup>
        {MORE_FEATURES.map((item) => (
          <MenuRow
            key={item.key}
            icon={NAV_ICONS[item.icon]}
            label={item.label}
            description={item.key === "tv" ? <TvCountryLabel /> : item.description}
            href={item.href}
          />
        ))}
      </MenuGroup>

      <MenuGroup>
        {MORE_ACCOUNT.map((item) => (
          <MenuRow
            key={item.key}
            icon={NAV_ICONS[item.icon]}
            label={item.label}
            description={item.description}
            href={item.href}
          />
        ))}
      </MenuGroup>
    </div>
  );
}

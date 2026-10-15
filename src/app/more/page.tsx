import { HardDrive } from "lucide-react";
import { constructMetadata } from "@/lib/metadata";
import { MORE_ACCOUNT, MORE_FEATURES } from "@/lib/nav/config";
import { NAV_ICONS } from "@/components/shell/navIcons";
import { MenuGroup, MenuRow } from "@/components/more/MenuRow";

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

      {/* No accounts yet: say plainly where follows and settings live. */}
      <div className="flex items-start gap-4 px-4 py-4 rounded-[var(--card-radius)] bg-[var(--bg-card)]">
        <HardDrive aria-hidden="true" className="w-6 h-6 shrink-0 text-[var(--text-muted)] mt-0.5" />
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Your follows and settings are saved on this device. Clearing your browser data resets them.
        </p>
      </div>

      <MenuGroup>
        {MORE_FEATURES.map((item) => (
          <MenuRow
            key={item.key}
            icon={NAV_ICONS[item.icon]}
            label={item.label}
            description={item.description}
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

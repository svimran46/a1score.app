import { constructMetadata } from "@/lib/metadata";
import { SettingsClient } from "@/components/settings/SettingsClient";
import { SubPageHeader } from "@/components/more/SubPageHeader";

export const runtime = "edge";

export const metadata = constructMetadata({
  title: "Settings | a1score",
  description: "Theme, notifications and app information for a1score.",
  path: "/settings",
  noIndex: true,
});

export default function SettingsPage() {
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0";

  return (
    <div className="max-w-[720px] mx-auto space-y-6 pb-8">
      <SubPageHeader title="Settings" backHref="/more" backLabel="Back to More" />
      <SettingsClient appVersion={appVersion} />
    </div>
  );
}

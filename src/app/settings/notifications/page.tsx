import { constructMetadata } from "@/lib/metadata";
import { SubPageHeader } from "@/components/more/SubPageHeader";
import { NotificationSettingsCard } from "@/components/notifications/NotificationSettingsCard";
import { FollowingAlertsSummary } from "@/components/notifications/FollowingAlertsSummary";

export const runtime = "edge";

export const metadata = constructMetadata({
  title: "Notifications | a1score",
  description: "Manage push alerts for the players, teams and leagues you follow.",
  path: "/settings/notifications",
  noIndex: true,
});

export default function NotificationsSettingsPage() {
  return (
    <div className="max-w-[720px] mx-auto space-y-6 pb-8">
      <SubPageHeader title="Notifications" backHref="/settings" backLabel="Back to Settings" />
      <NotificationSettingsCard />
      <FollowingAlertsSummary />
    </div>
  );
}

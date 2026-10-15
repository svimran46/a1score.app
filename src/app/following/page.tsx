import { constructMetadata } from "@/lib/metadata";
import { FollowingClient } from "@/components/following/FollowingClient";

export const runtime = "edge";

export const metadata = constructMetadata({
  title: "Following | a1score",
  description: "The teams and players you follow, with market value changes since you followed them.",
  path: "/following",
  noIndex: true,
});

export default function FollowingPage() {
  return <FollowingClient />;
}

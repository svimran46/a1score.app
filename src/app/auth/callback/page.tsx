import { constructMetadata } from "@/lib/metadata";
import { AuthCallbackClient } from "@/components/auth/AuthCallbackClient";

export const runtime = "edge";

export const metadata = constructMetadata({
  title: "Signing in | a1score",
  description: "Completing sign-in.",
  path: "/auth/callback",
  noIndex: true,
});

export default function AuthCallbackPage() {
  return <AuthCallbackClient />;
}

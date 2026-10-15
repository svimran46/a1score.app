import { constructMetadata } from "@/lib/metadata";
import { SignInClient } from "@/components/auth/SignInClient";

export const runtime = "edge";

export const metadata = constructMetadata({
  title: "Sign in | a1score",
  description: "Sign in to sync your follows and settings across devices.",
  path: "/signin",
  noIndex: true,
});

export default function SignInPage() {
  return <SignInClient />;
}

import Link from "next/link";

import { Button } from "@/components/ui/button";

/** Global 404 — points back to live matches. */
export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-4xl font-black tracking-tight">
        4<span className="text-primary">0</span>4
      </p>
      <p className="font-medium">This page doesn&apos;t exist</p>
      <p className="text-muted-foreground max-w-sm text-sm">
        The match, team or page you&apos;re looking for may have been moved — or it never existed,
        like a clean sheet against your team.
      </p>
      <Button asChild>
        <Link href="/">Back to live matches</Link>
      </Button>
    </div>
  );
}

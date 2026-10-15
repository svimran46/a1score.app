"use client";

import React from "react";
import { MoreVertical } from "lucide-react";
import { MenuButton, MenuCheckboxItem, MenuItem, MenuLinkItem } from "@/components/ui/MenuButton";

/** ⋮ menu on the Matches header: view options that FotMob keeps one tap away. */
export function MatchesOverflowMenu({
  byTime,
  onToggleByTime,
  onCollapseAll,
  onExpandAll,
}: {
  byTime: boolean;
  onToggleByTime: () => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
}) {
  return (
    <MenuButton
      ariaLabel="Match list options"
      label={<MoreVertical aria-hidden="true" className="w-5 h-5" />}
      buttonClassName="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
    >
      <MenuCheckboxItem checked={byTime} onToggle={onToggleByTime} closeOnSelect>
        By time
      </MenuCheckboxItem>
      <MenuItem onSelect={onCollapseAll} disabled={byTime}>
        Collapse all leagues
      </MenuItem>
      <MenuItem onSelect={onExpandAll} disabled={byTime}>
        Expand all leagues
      </MenuItem>
      <MenuLinkItem href="/settings/notifications">Edit alerts</MenuLinkItem>
    </MenuButton>
  );
}

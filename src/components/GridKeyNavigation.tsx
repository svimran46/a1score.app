"use client";

import { useEffect } from "react";

export function GridKeyNavigation() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't intercept arrow keys inside input elements or editable targets
      const active = document.activeElement as HTMLElement | null;
      if (
        !active ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName) ||
        active.isContentEditable
      ) {
        return;
      }

      const isArrowKey = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ].includes(e.key);

      if (!isArrowKey) return;

      const focusableSelector =
        'a[href], button:not([disabled]), [tabindex="0"], input:not([disabled])';
      const allFocusable = Array.from(
        document.querySelectorAll<HTMLElement>(focusableSelector)
      ).filter((el) => {
        // Must be visible and not hidden
        return el.offsetParent !== null && !el.hasAttribute("aria-hidden");
      });

      if (allFocusable.length === 0) return;

      const currentRect = active.getBoundingClientRect();
      const currentCenterX = currentRect.left + currentRect.width / 2;
      const currentCenterY = currentRect.top + currentRect.height / 2;

      let bestCandidate: HTMLElement | null = null;
      let minDistance = Infinity;

      for (const el of allFocusable) {
        if (el === active) continue;
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = centerX - currentCenterX;
        const dy = centerY - currentCenterY;

        let isValidDirection = false;
        let primaryDist = 0;
        let secondaryDist = 0;

        switch (e.key) {
          case "ArrowRight":
            if (dx > 5) {
              isValidDirection = true;
              primaryDist = dx;
              secondaryDist = Math.abs(dy);
            }
            break;
          case "ArrowLeft":
            if (dx < -5) {
              isValidDirection = true;
              primaryDist = Math.abs(dx);
              secondaryDist = Math.abs(dy);
            }
            break;
          case "ArrowDown":
            if (dy > 5) {
              isValidDirection = true;
              primaryDist = dy;
              secondaryDist = Math.abs(dx);
            }
            break;
          case "ArrowUp":
            if (dy < -5) {
              isValidDirection = true;
              primaryDist = Math.abs(dy);
              secondaryDist = Math.abs(dx);
            }
            break;
        }

        if (isValidDirection) {
          // Weight secondary axis more heavily to prioritize rows/columns in grids
          const distance = primaryDist + secondaryDist * 1.5;
          if (distance < minDistance) {
            minDistance = distance;
            bestCandidate = el;
          }
        }
      }

      if (bestCandidate) {
        e.preventDefault();
        bestCandidate.focus();
        bestCandidate.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return null;
}

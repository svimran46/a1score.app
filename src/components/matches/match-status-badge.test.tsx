import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MatchStatusBadge } from "./match-status-badge";

describe("<MatchStatusBadge />", () => {
  it("renders the live minute", () => {
    render(<MatchStatusBadge statusShort="2H" elapsed={67} date="2026-09-23T20:00:00+00:00" />);
    expect(screen.getByText("67'")).toBeInTheDocument();
  });

  it("renders FT with no pulse dot", () => {
    render(<MatchStatusBadge statusShort="FT" elapsed={90} date="2026-09-23T20:00:00+00:00" />);
    expect(screen.getByText("FT")).toBeInTheDocument();
  });

  it("renders a kickoff time for not-started matches", () => {
    render(<MatchStatusBadge statusShort="NS" elapsed={null} date="2026-09-23T20:45:00+00:00" />);
    expect(screen.getByText(/^\d{2}:\d{2}$/)).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CapacityBar } from "../../components/CapacityBar";

describe("CapacityBar", () => {
  it("shows correct registered/capacity text", () => {
    render(<CapacityBar filled={3} capacity={10} />);

    expect(screen.getByText("3 / 10 registered")).toBeInTheDocument();
    expect(screen.getByText("7 left")).toBeInTheDocument();
  });

  it("shows Full when capacity is reached", () => {
    render(<CapacityBar filled={5} capacity={5} />);

    expect(screen.getByText("Full")).toBeInTheDocument();
    expect(screen.getByText("5 / 5 registered")).toBeInTheDocument();
  });

  it("handles zero capacity safely", () => {
    render(<CapacityBar filled={0} capacity={0} />);

    expect(screen.getByText("0 / 0 registered")).toBeInTheDocument();
    expect(screen.getByText("0 left")).toBeInTheDocument();
  });
});

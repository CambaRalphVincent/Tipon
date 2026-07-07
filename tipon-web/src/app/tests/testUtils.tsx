import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";

export function renderWithRouter(ui: React.ReactElement, initialEntries = ["/"]) {
  return render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);
}

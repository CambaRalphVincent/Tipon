import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AttendanceBadge } from "../../components/StatusBadge";

describe("AttendanceBadge", () => {
  it("renders a high-contrast present badge", () => {
    const html = renderToStaticMarkup(React.createElement(AttendanceBadge, { status: "present" }));

    expect(html).toContain("Present");
    expect(html).toContain("bg-emerald-500");
    expect(html).toContain("text-emerald-950");
  });

  it("renders pending and absent statuses distinctly", () => {
    expect(renderToStaticMarkup(React.createElement(AttendanceBadge, { status: "pending" }))).toContain("Pending");
    expect(renderToStaticMarkup(React.createElement(AttendanceBadge, { status: "absent" }))).toContain("Absent");
  });
});

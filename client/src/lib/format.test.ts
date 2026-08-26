import { describe, expect, it } from "vitest";
import { formatMoney } from "./format";

describe("formatMoney", () => {
  it("formats Shopify money objects using their supplied currency", () => {
    expect(formatMoney({ amount: "1350.00", currencyCode: "ZAR" })).toBe("ZAR 1,350");
  });

  it("formats raw amounts with a supplied currency", () => {
    expect(formatMoney("99.95", "USD")).toBe("$99.95");
  });
});

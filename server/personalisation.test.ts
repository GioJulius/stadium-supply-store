import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

const caller = () => appRouter.createCaller({} as never);

/** Only input validation is exercised — no Shopify call is made on a reject. */
async function addLine(personalisation: unknown) {
  return caller().commerce.cart.create({
    lines: [{ variantId: "gid://shopify/ProductVariant/1", quantity: 1, personalisation }],
  } as never);
}

describe("cart personalisation validation", () => {
  it("rejects a name longer than a shirt back can carry", async () => {
    await expect(addLine({ name: "ABCDEFGHIJKLMNOP", number: "10" })).rejects.toThrow();
  });

  it("rejects characters a print shop cannot set", async () => {
    await expect(addLine({ name: "JULIUS@#$", number: "10" })).rejects.toThrow();
  });

  it("rejects a squad number outside 0-99", async () => {
    await expect(addLine({ name: "JULIUS", number: "100" })).rejects.toThrow();
    await expect(addLine({ name: "JULIUS", number: "7A" })).rejects.toThrow();
  });

  it("rejects an empty personalisation, which would print a blank shirt", async () => {
    await expect(addLine({ name: "", number: "" })).rejects.toThrow();
  });
});

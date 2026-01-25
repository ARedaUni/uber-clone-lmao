import { describe, it, expect } from "vitest";
import { app } from "./app.js";

describe("Health Check", () => {
  it("returns ok status", async () => {
    const response = await app.request("/health");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });
});

import { test, expect } from "@playwright/test";

// Verifies that the replay player page loads without runtime errors and
// that the player container is present with non-zero dimensions.
// Uses mock data (DATA_SOURCE=mock) so no PostHog credentials needed.
// See docs/architecture/recordings.md for player architecture context.

test.describe("Replay player", () => {
  test("loads /grabaciones without visible errors", async ({ page }) => {
    const runtimeErrors: string[] = [];
    page.on("pageerror", (err) => runtimeErrors.push(err.message));

    await page.goto("/grabaciones");

    // Page title rendered by AppShell
    await expect(page.getByRole("heading", { name: /grabaciones/i })).toBeVisible();

    // Stats bar should render
    await expect(page.getByText("Grabaciones disponibles")).toBeVisible();

    // No uncaught runtime errors
    expect(runtimeErrors).toHaveLength(0);
  });

  test("player container exists and has non-zero dimensions when recording is available", async ({
    page,
  }) => {
    const runtimeErrors: string[] = [];
    page.on("pageerror", (err) => runtimeErrors.push(err.message));

    await page.goto("/grabaciones");

    // The player wrapper rendered by RRWebPlayer has a known class.
    // In mock mode, sessions may not have a real recording — check for either
    // the player container or the "Sin grabación" placeholder.
    const playerWrapper = page.locator(
      ".overflow-hidden.rounded-md.border.border-slate-800.bg-slate-950"
    );
    await expect(playerWrapper.first()).toBeVisible();

    // Container must have positive dimensions — catches the "invisible/zero size" regression.
    const box = await playerWrapper.first().boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);

    expect(runtimeErrors).toHaveLength(0);
  });

  test("event timeline is visible in the aside", async ({ page }) => {
    await page.goto("/grabaciones");

    // The aside panel heading
    await expect(page.getByRole("heading", { name: "Eventos" })).toBeVisible();
  });
});

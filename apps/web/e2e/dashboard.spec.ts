import { expect, test } from "@playwright/test";
import { label, mailpit, role, signUpAndOnboard, text } from "./helpers";

// Optional: set SCREENSHOT_DIR to save full-page screenshots for visual review.
const shots = process.env.SCREENSHOT_DIR;

test.beforeAll(() => {
  if (!mailpit)
    throw new Error("MAILPIT_URL is not set. Run via: pnpm --filter @nutritrack/web test:e2e");
});

test("dashboard shows real targets, honest empty states, and tracks water and weight", async ({
  page,
}, info) => {
  await signUpAndOnboard(page, `e2e-dash-${info.project.name}-${Date.now()}@example.com`);

  // Empty day: nothing is invented.
  await expect(role(page, "heading", "Calories today")).toBeVisible();
  await expect(text(page, "0 kcal", true).first()).toBeVisible();
  await expect(text(page, "Nothing logged for breakfast yet.")).toBeVisible();
  await expect(text(page, /Nothing logged yet/)).toBeVisible(); // rule-based note
  await expect(text(page, "Food logging is coming soon")).toBeVisible();
  await expect(role(page, "button", /Snap your meal/)).toBeDisabled();
  if (shots)
    await page.screenshot({ path: `${shots}/home-${info.project.name}.png`, fullPage: true });

  // Water: quick-add a sachet, then undo.
  await role(page, "button", /Sachet/).click();
  await expect(text(page, "Added a sachet (500 ml).")).toBeVisible();
  await expect(text(page, "0.5 L", true)).toBeVisible();
  await role(page, "button", "Undo last").click();
  await expect(text(page, "Removed 500 ml.")).toBeVisible();
  await expect(text(page, "0 L", true)).toBeVisible();

  // Weight: validation, then a saved weigh-in replaces today's onboarding entry.
  await label(page, "Today's weight in kilograms").fill("12");
  await role(page, "button", /^Save$/).click();
  await expect(text(page, "Enter a weight between 20 and 400 kg")).toBeVisible();
  await label(page, "Today's weight in kilograms").fill("69.4");
  await role(page, "button", /^Save$/).click();
  await expect(text(page, "Saved 69.4 kg for today.")).toBeVisible();
  await expect(text(page, "69.4 kg", true).first()).toBeVisible();

  // Navigation: Progress is real; Food and Scan say they're coming.
  await role(page, "link", /^Progress$/)
    .first()
    .click();
  await expect(role(page, "heading", "Progress")).toBeVisible();
  await expect(role(page, "heading", "Weight trend")).toBeVisible();
  await role(page, "link", /^Scan( Soon)?$/).click();
  await expect(role(page, "heading", "Scan your meal")).toBeVisible();
  await expect(text(page, "Coming soon", true)).toBeVisible();
  await role(page, "link", /^Food( Soon)?$/).click();
  await expect(role(page, "heading", /^Food$/)).toBeVisible();
  if (shots) {
    await page.goto("/home");
    await expect(role(page, "heading", "Calories today")).toBeVisible();
    await page.screenshot({
      path: `${shots}/home-weight-${info.project.name}.png`,
      fullPage: true,
    });
  }
});

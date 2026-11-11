import { expect, test } from "@playwright/test";
import { role, text } from "./helpers";

const WIDTHS = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "desktop", width: 1440, height: 900 },
];

test.describe("landing page", () => {
  // Layout checks set their own viewport, so they only need one browser project.
  test.beforeEach(() => {
    test.skip(test.info().project.name !== "desktop", "viewport sweep runs once");
  });

  for (const vp of WIDTHS) {
    test(`renders every section without sideways scrolling at ${vp.name} width`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      await page.goto("/");

      await expect(role(page, "heading", /Eat better/)).toBeVisible();
      for (const heading of [
        "Your meals deserve to be counted too.",
        "Less typing. More understanding.",
        "Understand your numbers.",
        "Small changes. Measurable progress.",
        "Three steps to knowing your numbers.",
        "Better decisions start with better information.",
        "Your next meal is a fresh opportunity.",
      ]) {
        await expect(page.getByRole("heading", { name: heading })).toBeAttached();
      }
      // Honesty: unbuilt features and example numbers are labelled.
      await expect(text(page, "Food logging is coming soon")).toBeAttached();
      await expect(text(page, "Illustrative preview with example numbers.").first()).toBeAttached();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }
});

test("mobile menu opens, links to sections and closes with Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Open menu" });
  await toggle.click();
  const menu = page.locator("#mobile-menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("link", { name: "Get started — Free" })).toHaveAttribute(
    "href",
    "/sign-up",
  );
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();

  await page.getByRole("button", { name: "Open menu" }).click();
  await menu.getByRole("link", { name: "How it works" }).click();
  await expect(menu).toBeHidden();
  await expect(page).toHaveURL(/#how-it-works$/);
});

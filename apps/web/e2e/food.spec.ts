import { expect, test } from "@playwright/test";
import { label, mailpit, role, signUpAndOnboard, text } from "./helpers";

// Optional: set SCREENSHOT_DIR to save screenshots for visual review.
const shots = process.env.SCREENSHOT_DIR;

test.beforeAll(() => {
  if (!mailpit)
    throw new Error("MAILPIT_URL is not set. Run via: pnpm --filter @nutritrack/web test:e2e");
});

test("search by local name, see sourced values, and manage a private food", async ({
  page,
}, info) => {
  await signUpAndOnboard(page, `e2e-food-${info.project.name}-${Date.now()}@example.com`);

  // The dashboard's search action is a real link now.
  await role(page, "link", /Search food/).click();
  await expect(role(page, "heading", /^Food$/)).toBeVisible();

  // Local-name search.
  await label(page, "Search foods").fill("ewa");
  await expect(text(page, "“ewa” · Yoruba")).toBeVisible();
  if (shots)
    await page.screenshot({
      path: `${shots}/food-search-${info.project.name}.png`,
      fullPage: true,
    });
  await role(page, "link", /Beans \(cowpeas\), boiled/).click();

  // Detail: source, review status and per-portion maths.
  await expect(role(page, "heading", "Beans (cowpeas), boiled")).toBeVisible();
  await expect(text(page, /USDA FoodData Central/).first()).toBeVisible();
  await expect(text(page, "Not yet reviewed").first()).toBeVisible();
  await expect(text(page, "116 kcal", true)).toBeVisible(); // per 100 g
  await role(page, "button", /^1 cup/).click();
  await expect(text(page, "116 kcal", true)).toHaveCount(0);
  await expect(role(page, "button", "Log this food")).toBeDisabled();
  if (shots)
    await page.screenshot({
      path: `${shots}/food-detail-${info.project.name}.png`,
      fullPage: true,
    });

  // Nothing found → offer to add it.
  await page.goto("/food");
  await label(page, "Search foods").fill("zzqx");
  await expect(text(page, /No foods match/)).toBeVisible();

  // Add a private food: validation, then save.
  await page.goto("/food/new");
  await expect(role(page, "heading", "Add your own food")).toBeVisible();
  await role(page, "button", "Save food").click();
  await expect(text(page, "Enter a name")).toBeVisible();
  await label(page, "Name").fill("Ada's moi moi");
  await label(page, "Calories (kcal)").fill("150");
  await label(page, "Protein (g)").fill("8");
  await label(page, "Carbs (g)").fill("14");
  await label(page, "Fat (g)").fill("6");
  await page.getByLabel("Unit").filter({ visible: true }).selectOption("wrap");
  await label(page, "Weight of one (g)").fill("180");
  await role(page, "button", "Save food").click();

  await expect(role(page, "heading", "Ada's moi moi")).toBeVisible();
  await expect(text(page, "Your food").first()).toBeVisible();
  await role(page, "button", "1 wrap (180 g)").click();
  await expect(text(page, "270 kcal", true)).toBeVisible(); // 150 × 1.8

  // It appears under "Your foods", then delete it.
  await role(page, "link", "Back to search").click();
  await expect(role(page, "link", /Ada's moi moi/)).toBeVisible();
  await role(page, "link", /Ada's moi moi/).click();
  await role(page, "button", "Delete this food").click();
  await role(page, "button", "Delete food").click();
  await expect(role(page, "heading", /^Food$/)).toBeVisible();
  await expect(text(page, "Foods you add yourself appear here.")).toBeVisible();
});

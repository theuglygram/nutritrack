import { localIsoDate } from "@nutritrack/api-client";
import { ageInYears, calculateDailyTargets } from "@nutritrack/core";
import { expect, test, type Page } from "@playwright/test";

// Next 16 (Cache Components) keeps visited pages mounted but hidden via <Activity>, so every
// locator is narrowed to visible elements. Hidden pages are also out of the accessibility tree.
const label = (page: Page, name: string) => page.getByLabel(name).filter({ visible: true });
const role = (page: Page, r: Parameters<Page["getByRole"]>[0], name: string | RegExp) =>
  page.getByRole(r, { name }).filter({ visible: true });
const text = (page: Page, t: string | RegExp, exact = false) =>
  page.getByText(t, { exact }).filter({ visible: true });

const mailpit = process.env.MAILPIT_URL;
const nf = new Intl.NumberFormat("en-NG");

async function emailedCode(email: string): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt++) {
    const res = await fetch(
      `${mailpit}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`,
    );
    const { messages } = (await res.json()) as { messages: { ID: string }[] };
    if (messages[0]) {
      const msg = (await (await fetch(`${mailpit}/api/v1/message/${messages[0].ID}`)).json()) as {
        Text: string;
      };
      const code = /\b(\d{6})\b/.exec(msg.Text)?.[1];
      if (code) return code;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`No code emailed to ${email}`);
}

async function next(page: Page) {
  await role(page, "button", "Continue").click();
}

test.beforeAll(() => {
  if (!mailpit)
    throw new Error("MAILPIT_URL is not set. Run via: pnpm --filter @nutritrack/web test:e2e");
});

test("sign up, confirm with emailed code, onboard, override targets, sign out", async ({
  page,
}, info) => {
  const email = `e2e-${info.project.name}-${Date.now()}@example.com`;
  const expected = calculateDailyTargets({
    sex: "female",
    ageYears: ageInYears("1990-05-01", localIsoDate()),
    heightCm: 165,
    weightKg: 70,
    activityLevel: "moderate",
    goalType: "lose",
    targetRateKgPerWeek: 0.5,
    strengthTrains: true,
  });

  // Signed-out visitors are sent to sign-in.
  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in$/);

  // Sign up.
  await role(page, "link", "Create an account").click();
  // Wait for the new page before typing (the old one stays visible until navigation finishes).
  await expect(role(page, "heading", "Create your account")).toBeVisible();
  await label(page, "Email").fill(email);
  await label(page, "Password").fill("short");
  await role(page, "button", "Create account").click();
  await expect(text(page, "Use at least 8 characters")).toBeVisible();
  await expect(text(page, "Enter a valid email address")).toHaveCount(0);
  await label(page, "Password").fill("jollof2026");
  await role(page, "button", "Create account").click();

  // Confirm email with the 6-digit code.
  await expect(page).toHaveURL(/\/verify-email\?email=/);
  await expect(role(page, "heading", "Confirm your email")).toBeVisible();
  await label(page, "Confirmation code").fill("000000");
  await role(page, "button", "Confirm email").click();
  // (Next's route announcer is also role="alert", so match the message text.)
  await expect(text(page, /wrong or has expired/)).toBeVisible();
  await label(page, "Confirmation code").fill(await emailedCode(email));
  await role(page, "button", "Confirm email").click();

  // Onboarding — step 1.
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(role(page, "heading", "About you")).toBeFocused();
  await next(page);
  await expect(text(page, "Enter your name")).toBeVisible(); // validation shown, not advanced
  await label(page, "What should we call you?").fill("Ada");
  await role(page, "radio", "Female").click();
  await label(page, "Date of birth").fill("2015-01-01");
  await label(page, "Height (cm)").fill("165");
  await label(page, "Current weight (kg)").fill("70");
  await next(page);
  await expect(text(page, "NutriTrack is for adults aged 18 and over").first()).toBeVisible();
  await label(page, "Date of birth").fill("1990-05-01");
  await next(page);

  // Step 2.
  await role(page, "radio", /Moderately active/).click();
  await role(page, "radio", /^Yes/).click();
  await next(page);

  // Step 3.
  await role(page, "radio", "Lose weight").click();
  await label(page, "Target weight (kg)").fill("62");
  await role(page, "radio", "0.5 kg a week").click();
  await next(page);

  // Step 4: preview matches packages/core; consent required.
  await expect(text(page, nf.format(expected.calorieTarget), true)).toBeVisible();
  await expect(text(page, `${expected.proteinG} g`, true)).toBeVisible();
  await role(page, "button", "Start tracking").click();
  await expect(text(page, "You need to agree before continuing")).toBeVisible();
  await page.getByRole("checkbox").filter({ visible: true }).click();
  await role(page, "button", "Start tracking").click();

  // Home shows the saved targets.
  await expect(page).toHaveURL(/\/$/);
  await expect(role(page, "heading", "Hello, Ada")).toBeVisible();
  await expect(text(page, nf.format(expected.calorieTarget), true)).toBeVisible();

  // Signed-in users are kept out of sign-in.
  await page.goto("/sign-in");
  await expect(page).toHaveURL(/\/$/);

  // Override targets: the calorie floor is enforced, then a valid override saves.
  await role(page, "link", "Settings").click();
  await expect(role(page, "heading", "Settings")).toBeVisible();
  await label(page, "Calories (kcal)").fill("1100");
  await role(page, "button", "Save my targets").click();
  await expect(text(page, /minimum is 1200 kcal/)).toBeVisible();
  await label(page, "Calories (kcal)").fill("1900");
  await role(page, "button", "Save my targets").click();
  await expect(page.getByRole("status").filter({ visible: true })).toContainText(
    "Your targets are saved.",
  );
  await role(page, "link", "Today").click();
  await expect(role(page, "heading", "Hello, Ada")).toBeVisible();
  await expect(text(page, "1,900", true)).toBeVisible();
  await expect(text(page, "You've set these targets yourself.")).toBeVisible();

  // Sign out; protected pages redirect again.
  await role(page, "button", "Sign out").click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/sign-in$/);
});

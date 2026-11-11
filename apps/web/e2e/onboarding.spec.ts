import { localIsoDate } from "@nutritrack/api-client";
import { ageInYears, calculateDailyTargets } from "@nutritrack/core";
import { expect, test } from "@playwright/test";
import { emailedCode, label, mailpit, next, role, text } from "./helpers";

const nf = new Intl.NumberFormat("en-NG");

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

  // Signed-out visitors see the landing page; its main call to action leads to sign-up.
  await page.goto("/");
  await expect(role(page, "heading", /Eat better/)).toBeVisible();
  await role(page, "link", /^Get started — Free/).click();

  // Sign up.
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

  // The dashboard shows the saved targets.
  await expect(page).toHaveURL(/\/home$/);
  await expect(role(page, "heading", /, Ada$/)).toBeVisible();
  await expect(text(page, `${nf.format(expected.calorieTarget)} kcal`, true)).toBeVisible();

  // Signed-in users are kept out of sign-in and the landing page.
  await page.goto("/sign-in");
  await expect(page).toHaveURL(/\/home$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/home$/);

  // Override targets: the calorie floor is enforced, then a valid override saves.
  await role(page, "link", /^Profile$/).click();
  await expect(role(page, "heading", "Profile")).toBeVisible();
  await label(page, "Calories (kcal)").fill("1100");
  await role(page, "button", "Save my targets").click();
  await expect(text(page, /minimum is 1200 kcal/)).toBeVisible();
  await label(page, "Calories (kcal)").fill("1900");
  await role(page, "button", "Save my targets").click();
  await expect(page.getByRole("status").filter({ visible: true })).toContainText(
    "Your targets are saved.",
  );
  await role(page, "link", /^Home$/).click();
  await expect(role(page, "heading", /, Ada$/)).toBeVisible();
  await expect(text(page, "1,900 kcal", true)).toBeVisible();
  await expect(role(page, "link", "Your own targets")).toBeVisible();

  // Sign out (from Profile, which every screen size can reach); protected pages redirect again.
  await role(page, "link", /^Profile$/).click();
  await expect(role(page, "heading", "Profile")).toBeVisible();
  await role(page, "button", "Sign out").first().click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/sign-in$/);
});

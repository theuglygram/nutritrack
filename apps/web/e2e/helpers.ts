import { expect, type Page } from "@playwright/test";

// Next 16 (Cache Components) keeps visited pages mounted but hidden via <Activity>, so every
// locator is narrowed to visible elements. Hidden pages are also out of the accessibility tree.
export const label = (page: Page, name: string) => page.getByLabel(name).filter({ visible: true });
export const role = (page: Page, r: Parameters<Page["getByRole"]>[0], name: string | RegExp) =>
  page.getByRole(r, { name }).filter({ visible: true });
export const text = (page: Page, t: string | RegExp, exact = false) =>
  page.getByText(t, { exact }).filter({ visible: true });

export const mailpit = process.env.MAILPIT_URL;

export async function emailedCode(email: string): Promise<string> {
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

export async function next(page: Page) {
  await role(page, "button", "Continue").click();
}

/** Signs up with a fresh email, confirms it and completes onboarding with simple answers. */
export async function signUpAndOnboard(page: Page, email: string, name = "Ada"): Promise<void> {
  await page.goto("/sign-up");
  await expect(role(page, "heading", "Create your account")).toBeVisible();
  await label(page, "Email").fill(email);
  await label(page, "Password").fill("jollof2026");
  await role(page, "button", "Create account").click();
  await expect(role(page, "heading", "Confirm your email")).toBeVisible();
  await label(page, "Confirmation code").fill(await emailedCode(email));
  await role(page, "button", "Confirm email").click();
  await expect(role(page, "heading", "About you")).toBeVisible();
  await label(page, "What should we call you?").fill(name);
  await role(page, "radio", "Female").click();
  await label(page, "Date of birth").fill("1990-05-01");
  await label(page, "Height (cm)").fill("165");
  await label(page, "Current weight (kg)").fill("70");
  await next(page);
  await role(page, "radio", /Moderately active/).click();
  await role(page, "radio", /^Yes/).click();
  await next(page);
  await role(page, "radio", "Lose weight").click();
  await label(page, "Target weight (kg)").fill("62");
  await role(page, "radio", "0.5 kg a week").click();
  await next(page);
  await page.getByRole("checkbox").filter({ visible: true }).click();
  await role(page, "button", "Start tracking").click();
  await expect(page).toHaveURL(/\/home$/);
}

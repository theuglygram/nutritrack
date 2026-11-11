import { APP_DESCRIPTION, APP_NAME, NOT_MEDICAL_ADVICE } from "@nutritrack/core";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  Dumbbell,
  HeartPulse,
  PencilLine,
  Ruler,
  Scale,
  Sparkles,
  Target,
  TrendingDown,
  UtensilsCrossed,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { FOOD_MEDIA, FoodArt, type FoodKey } from "@/components/brand/food-art";
import { Logo } from "@/components/brand/logo";
import {
  DashboardPreview,
  LoggingSteps,
  NutritionPreview,
  PreviewCaption,
  WeightPreview,
} from "@/components/landing/previews";
import { RevealObserver } from "@/components/landing/reveal-observer";
import { SiteNav, ctaPrimary, ctaSecondary } from "@/components/landing/site-nav";
import { cn } from "cn";

export const metadata: Metadata = {
  title: { absolute: `${APP_NAME} — Eat better. Know your numbers.` },
  description: APP_DESCRIPTION,
};

/** Public marketing page. Static: no user data, no requests. */
export default function LandingPage() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>
      <SiteNav />
      <main id="main" className="flex-1">
        <Hero />
        <FoodIntelligence />
        <SmartLogging />
        <NutritionTracking />
        <ProgressTracking />
        <HowItWorks />
        <Goals />
        <Trust />
        <FinalCta />
      </main>
      <SiteFooter />
      <RevealObserver />
    </>
  );
}

function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>{children}</div>;
}

function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-sm font-semibold tracking-[0.14em] text-primary uppercase", className)}>
      {children}
    </p>
  );
}

function SectionHeading({
  eyebrow,
  title,
  body,
  className,
  invert,
}: {
  eyebrow: string;
  title: string;
  body: string;
  className?: string;
  invert?: boolean;
}) {
  return (
    <div className={cn("flex max-w-2xl flex-col gap-4", className)} data-reveal>
      <Eyebrow className={invert ? "text-lime" : undefined}>{eyebrow}</Eyebrow>
      <h2 className="text-4xl font-bold sm:text-5xl">{title}</h2>
      <p
        className={cn(
          "text-lg leading-relaxed",
          invert ? "text-on-forest/80" : "text-muted-foreground",
        )}
      >
        {body}
      </p>
    </div>
  );
}

function ComingSoon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium",
        className,
      )}
    >
      <span aria-hidden="true" className="size-2 rounded-full bg-carbs" />
      {children}
    </p>
  );
}

// 1–2. Hero -----------------------------------------------------------------------------------

function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <Container className="grid items-center gap-12 pt-10 pb-20 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12 lg:pt-20 lg:pb-28">
        <div className="flex flex-col gap-7">
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-sm font-semibold text-primary">
            <UtensilsCrossed className="size-4" aria-hidden="true" />
            Nigerian-first nutrition tracking
          </p>
          <h1
            id="hero-title"
            className="text-5xl leading-[1.04] font-bold sm:text-6xl xl:text-[4.25rem]"
          >
            Eat better.
            <br />
            <span className="text-primary">
              Know your{" "}
              <span className="relative inline-block">
                numbers.
                <svg
                  aria-hidden="true"
                  viewBox="0 0 300 12"
                  preserveAspectRatio="none"
                  className="absolute -bottom-2 left-0 h-3 w-full text-lime"
                >
                  <path
                    d="M2 9C80 3 200 2 298 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Whether you&apos;re trying to lose weight, build muscle or simply eat healthier,
            NutriTrack helps you understand what goes into your body — one Nigerian meal at a time.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/sign-up" className={ctaPrimary}>
              Get started — Free
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <a href="#how-it-works" className={ctaSecondary}>
              Explore how it works
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:h-[560px] lg:max-w-none">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-forest lg:absolute lg:top-0 lg:right-0 lg:aspect-auto lg:h-[470px] lg:w-[84%]">
            <svg
              aria-hidden="true"
              viewBox="0 0 400 320"
              className="absolute inset-0 size-full text-on-forest/[0.06]"
            >
              <circle cx="330" cy="40" r="120" fill="none" stroke="currentColor" strokeWidth="30" />
              <circle cx="330" cy="40" r="60" fill="none" stroke="currentColor" strokeWidth="18" />
            </svg>
            <FoodArt
              food="jollof"
              priority
              className="absolute -top-[6%] right-[-6%] w-[66%] drop-shadow-2xl"
            />
            <FoodArt
              food="plantain"
              className="absolute top-[7%] left-[6%] w-[30%] drop-shadow-xl"
            />
            <FoodArt
              food="fish"
              className="absolute right-[-4%] bottom-[-10%] w-[40%] drop-shadow-xl"
            />
          </div>
          <div className="relative z-10 -mt-20 ml-auto w-full max-w-[400px] sm:-mt-28 lg:absolute lg:bottom-0 lg:left-0 lg:mt-0 lg:w-[400px]">
            <DashboardPreview />
            <PreviewCaption className="mt-2 text-right lg:text-left" />
          </div>
        </div>
      </Container>
    </section>
  );
}

// 3. Nigerian food intelligence ---------------------------------------------------------------

const FOODS: FoodKey[] = ["jollof", "egusi", "eba", "amala", "moimoi", "plantain", "beans", "fish"];

function FoodIntelligence() {
  return (
    <section
      id="nigerian-food"
      aria-labelledby="food-title"
      className="scroll-mt-16 bg-forest py-24 text-on-forest sm:py-32"
    >
      <Container className="flex flex-col gap-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="flex max-w-2xl flex-col gap-4" data-reveal>
            <Eyebrow className="text-lime">Nigerian food intelligence</Eyebrow>
            <h2 id="food-title" className="text-4xl font-bold sm:text-5xl">
              Your meals deserve to be counted too.
            </h2>
            <p className="text-lg leading-relaxed text-on-forest/80">
              From jollof rice and egusi to moi moi, amala and plantain, track familiar meals with
              serving sizes that make sense.
            </p>
          </div>
          <p className="max-w-sm text-on-forest/80" data-reveal data-reveal-delay="120">
            NutriTrack is being built around Nigerian food data: documented sources, local
            ingredients, cooking methods and the portions you actually use — a wrap of eba, a cup of
            rice, a piece of moi moi.
          </p>
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-4 sm:gap-x-8">
          {FOODS.map((food, i) => (
            <li
              key={food}
              className="group flex flex-col items-center gap-4 text-center"
              data-reveal
              data-reveal-delay={(i % 4) * 70}
            >
              <FoodArt
                food={food}
                className="w-full max-w-44 drop-shadow-[0_18px_24px_rgb(0_0_0/0.25)] transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-3"
              />
              <div>
                <p className="font-heading text-lg font-semibold">{FOOD_MEDIA[food].name}</p>
                <p className="text-sm text-on-forest/70">{FOOD_MEDIA[food].serving}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

// 4. Smart food logging -----------------------------------------------------------------------

function SmartLogging() {
  return (
    <section id="features" aria-labelledby="logging-title" className="scroll-mt-16 py-24 sm:py-32">
      <Container className="flex flex-col gap-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-2xl flex-col gap-4" data-reveal>
            <Eyebrow>Smart food logging</Eyebrow>
            <h2 id="logging-title" className="text-4xl font-bold sm:text-5xl">
              Less typing. More understanding.
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Search for food, describe what you ate or take a photo. NutriTrack helps identify
              meals and estimate portions for you to review.
            </p>
          </div>
          <ComingSoon>Food logging is coming soon</ComingSoon>
        </div>
        <LoggingSteps />
      </Container>
    </section>
  );
}

// 5. Nutrition tracking -----------------------------------------------------------------------

function NutritionTracking() {
  return (
    <section aria-labelledby="nutrition-title" className="bg-surface/60 py-24 sm:py-32">
      <Container className="grid items-center gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
        <div className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="Nutrition tracking"
            title="Understand your numbers."
            body="See your calories, protein, carbohydrates and fats in one place. Know where you stand and make informed food choices."
          />
          <ul className="flex flex-col gap-3" data-reveal data-reveal-delay="100">
            {[
              "Daily targets calculated from your body, activity and goal",
              "Protein, carbs and fat with what's left for the day",
              "Change your targets yourself whenever you need to",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <BadgeCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div data-reveal data-reveal-delay="120">
          <NutritionPreview />
          <PreviewCaption className="mt-3" />
        </div>
      </Container>
    </section>
  );
}

// 6. Progress tracking ------------------------------------------------------------------------

function ProgressTracking() {
  return (
    <section aria-labelledby="progress-title" className="py-24 sm:py-32">
      <Container className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="order-2 lg:order-1" data-reveal>
          <WeightPreview />
          <PreviewCaption className="mt-3" />
        </div>
        <div className="order-1 flex flex-col gap-6 lg:order-2">
          <SectionHeading
            eyebrow="Progress tracking"
            title="Small changes. Measurable progress."
            body="Track your weight, monitor trends and see how your habits change over time."
          />
          <div className="grid grid-cols-2 gap-3" data-reveal data-reveal-delay="100">
            <MiniStat
              icon={<Scale className="size-5" />}
              title="Weigh-ins"
              body="One a day, charted for you"
            />
            <MiniStat
              icon={<TrendingDown className="size-5" />}
              title="Trends"
              body="See the direction, not the noise"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}

function MiniStat({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4">
      <span
        className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

// 7. How it works -----------------------------------------------------------------------------

const STEPS = [
  { title: "Set your goal.", body: "Tell NutriTrack what you want to achieve." },
  { title: "Log what you eat.", body: "Search, describe or photograph your meals." },
  {
    title: "Understand your progress.",
    body: "See your daily nutrition and work towards your target.",
  },
];

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-title"
      className="scroll-mt-16 border-y border-border/70 bg-card py-24 sm:py-32"
    >
      <Container className="flex flex-col gap-14">
        <div className="flex max-w-2xl flex-col gap-4" data-reveal>
          <Eyebrow>How it works</Eyebrow>
          <h2 id="how-title" className="text-4xl font-bold sm:text-5xl">
            Three steps to knowing your numbers.
          </h2>
        </div>
        <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="relative flex flex-col gap-4"
              data-reveal
              data-reveal-delay={i * 100}
            >
              <div className="flex items-center gap-4">
                <span className="font-heading text-6xl leading-none font-bold text-primary tabular-nums">
                  0{i + 1}
                </span>
                {i < STEPS.length - 1 && (
                  <span aria-hidden="true" className="hidden h-px flex-1 bg-border md:block" />
                )}
              </div>
              <h3 className="text-2xl font-semibold">{s.title}</h3>
              <p className="text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

// 8. Goals ------------------------------------------------------------------------------------

const GOALS: {
  title: string;
  body: string;
  icon: ReactNode;
  foods: [FoodKey, FoodKey];
  tone: string;
}[] = [
  {
    title: "Lose weight",
    body: "Understand your calorie intake and build sustainable eating habits.",
    icon: <Target className="size-5" />,
    foods: ["fish", "egusi"],
    tone: "bg-primary-soft",
  },
  {
    title: "Build muscle",
    body: "Monitor your calories and protein to support your training.",
    icon: <Dumbbell className="size-5" />,
    foods: ["beans", "moimoi"],
    tone: "bg-lime/25",
  },
  {
    title: "Eat healthier",
    body: "Get a clearer picture of your everyday eating habits.",
    icon: <HeartPulse className="size-5" />,
    foods: ["amala", "plantain"],
    tone: "bg-surface",
  },
];

function Goals() {
  return (
    <section aria-labelledby="goals-title" className="py-24 sm:py-32">
      <Container className="flex flex-col gap-12">
        <div className="flex max-w-2xl flex-col gap-4" data-reveal>
          <Eyebrow>Built around your goals</Eyebrow>
          <h2 id="goals-title" className="text-4xl font-bold sm:text-5xl">
            Whatever you&apos;re working towards.
          </h2>
        </div>
        <ul className="grid gap-5 md:grid-cols-3">
          {GOALS.map((g, i) => (
            <li
              key={g.title}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card"
              data-reveal
              data-reveal-delay={i * 90}
            >
              <div className={cn("relative h-48 overflow-hidden", g.tone)} aria-hidden="true">
                <FoodArt
                  food={g.foods[0]}
                  className="absolute -top-6 -left-4 w-44 transition-transform duration-500 group-hover:rotate-6"
                />
                <FoodArt
                  food={g.foods[1]}
                  className="absolute -right-6 -bottom-10 w-48 transition-transform duration-500 group-hover:-rotate-6"
                />
              </div>
              <div className="flex flex-col gap-3 p-6">
                <span className="flex items-center gap-2 text-sm font-semibold tracking-[0.14em] text-primary uppercase">
                  <span aria-hidden="true">{g.icon}</span>
                  {g.title}
                </span>
                <p className="text-lg">{g.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

// 9. Trust and accuracy -----------------------------------------------------------------------

const TRUST = [
  {
    icon: <BookOpenText className="size-5" />,
    title: "Documented sources",
    body: "Nutrition information comes from documented food data sources, and every food records where its values came from.",
  },
  {
    icon: <BadgeCheck className="size-5" />,
    title: "Verification status",
    body: "Food entries are marked as verified or unverified, so you always know how much to rely on them.",
  },
  {
    icon: <Ruler className="size-5" />,
    title: "Familiar portions",
    body: "Serving sizes are designed around local portions, with each one converted to grams for that specific food.",
  },
  {
    icon: <Sparkles className="size-5" />,
    title: "Estimates, clearly labelled",
    body: "AI recognition gives estimates, not guaranteed exact values. Calorie maths is done by tested code, never by AI.",
  },
  {
    icon: <PencilLine className="size-5" />,
    title: "You stay in control",
    body: "Review and correct any AI suggestion before it's saved. Nothing is logged without your confirmation.",
  },
];

function Trust() {
  return (
    <section aria-labelledby="trust-title" className="bg-surface/60 py-24 sm:py-32">
      <Container className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start" data-reveal>
          <Eyebrow>Trust and accuracy</Eyebrow>
          <h2 id="trust-title" className="text-4xl font-bold sm:text-5xl">
            Better decisions start with better information.
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Numbers are only useful if you can trust them. Here&apos;s how NutriTrack handles yours.
          </p>
        </div>
        <ul className="flex flex-col divide-y divide-border/80 rounded-2xl border border-border/80 bg-card">
          {TRUST.map((t, i) => (
            <li key={t.title} className="flex gap-4 p-6" data-reveal data-reveal-delay={i * 60}>
              <span
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"
                aria-hidden="true"
              >
                {t.icon}
              </span>
              <div>
                <h3 className="text-lg font-semibold">{t.title}</h3>
                <p className="mt-1 text-muted-foreground">{t.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

// 10. Final call to action --------------------------------------------------------------------

function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="py-24 sm:py-32">
      <Container>
        <div
          className="relative overflow-hidden rounded-[2rem] bg-forest px-6 py-16 text-on-forest sm:px-12 sm:py-20"
          data-reveal
        >
          <FoodArt
            food="moimoi"
            className="pointer-events-none absolute -right-16 -bottom-20 hidden w-80 opacity-90 md:block"
          />
          <FoodArt
            food="eba"
            className="pointer-events-none absolute -top-16 right-48 hidden w-44 opacity-90 lg:block"
          />
          <div className="relative flex max-w-xl flex-col gap-6">
            <h2 id="cta-title" className="text-4xl font-bold sm:text-5xl">
              Your next meal is a fresh opportunity.
            </h2>
            <p className="text-lg text-on-forest/80">
              Start understanding what you eat. Start making progress with NutriTrack.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex h-12 w-fit items-center gap-2 rounded-xl bg-lime px-6 font-semibold text-lime-foreground transition hover:bg-lime/90 active:translate-y-px outline-none focus-visible:ring-3 focus-visible:ring-lime/50"
            >
              Create your free account
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

// 11. Footer ----------------------------------------------------------------------------------

function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-card">
      <Container className="grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex max-w-sm flex-col gap-4">
          <Logo />
          <p className="text-muted-foreground">{APP_DESCRIPTION}</p>
        </div>
        <nav aria-label="Product" className="flex flex-col gap-3">
          <p className="font-semibold">Product</p>
          <a href="#features" className="text-muted-foreground hover:text-foreground">
            Features
          </a>
          <a href="#how-it-works" className="text-muted-foreground hover:text-foreground">
            How it works
          </a>
          <a href="#nigerian-food" className="text-muted-foreground hover:text-foreground">
            Food database
          </a>
        </nav>
        <nav aria-label="Account" className="flex flex-col gap-3">
          <p className="font-semibold">Account</p>
          <Link href="/sign-up" className="text-muted-foreground hover:text-foreground">
            Create an account
          </Link>
          <Link href="/sign-in" className="text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
        </nav>
      </Container>
      <Container className="flex flex-col gap-3 border-t border-border/70 py-6 text-sm text-muted-foreground">
        <p className="max-w-3xl">{NOT_MEDICAL_ADVICE}</p>
        <p>© 2026 {APP_NAME}.</p>
        <p>Privacy policy and terms of service will be published before public launch.</p>
      </Container>
    </footer>
  );
}

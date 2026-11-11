import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "cn";

/**
 * Illustrated, top-down Nigerian dishes. These stand in for photography until licensed photos
 * are supplied (ADR-033): drop a file in public/food/ and set its path in FOOD_MEDIA below.
 * Shapes come from a seeded generator so server and client render identical markup.
 */

export type FoodKey =
  "jollof" | "egusi" | "eba" | "amala" | "moimoi" | "plantain" | "beans" | "fish";

export const FOOD_MEDIA: Record<FoodKey, { name: string; serving: string; photo?: string }> = {
  jollof: { name: "Jollof rice", serving: "by the cup or plate" },
  egusi: { name: "Egusi soup", serving: "by the ladle" },
  eba: { name: "Eba", serving: "by the wrap" },
  amala: { name: "Amala", serving: "by the wrap" },
  moimoi: { name: "Moi moi", serving: "by the wrap or piece" },
  plantain: { name: "Fried plantain", serving: "by the slice" },
  beans: { name: "Beans", serving: "by the cup" },
  fish: { name: "Grilled fish", serving: "by the piece" },
};

/** Deterministic pseudo-random numbers (mulberry32). */
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** A smooth, slightly irregular closed blob. */
function blob(cx: number, cy: number, radius: number, jitter: number, rand: () => number, n = 10) {
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const r = radius * (1 - jitter / 2 + rand() * jitter);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
  });
  const mid = (p: readonly [number, number], q: readonly [number, number]) =>
    [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2] as const;
  const last = pts[n - 1] as readonly [number, number];
  const first = pts[0] as readonly [number, number];
  const start = mid(last, first);
  let d = `M${r1(start[0])} ${r1(start[1])}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i] as readonly [number, number];
    const q = pts[(i + 1) % n] as readonly [number, number];
    const m = mid(p, q);
    d += ` Q${r1(p[0])} ${r1(p[1])} ${r1(m[0])} ${r1(m[1])}`;
  }
  return `${d}Z`;
}

/** Random point inside a circle, biased towards the centre a little. */
function inCircle(cx: number, cy: number, radius: number, rand: () => number) {
  const a = rand() * Math.PI * 2;
  const r = Math.sqrt(rand()) * radius;
  return [r1(cx + Math.cos(a) * r), r1(cy + Math.sin(a) * r)] as const;
}

function Plate({ children }: { children: ReactNode }) {
  return (
    <>
      <circle cx="122" cy="126" r="108" fill="#1C1F1A" opacity="0.10" />
      <circle cx="120" cy="120" r="108" fill="#FFFFFF" />
      <circle cx="120" cy="120" r="108" fill="none" stroke="#E7E0D1" strokeWidth="1.5" />
      <circle cx="120" cy="120" r="84" fill="#FBF8F2" stroke="#EDE6D8" strokeWidth="1.5" />
      {children}
    </>
  );
}

function Dome({
  base,
  light,
  speck,
  seed,
}: {
  base: string;
  light: string;
  speck: string;
  seed: number;
}) {
  const rand = rng(seed);
  return (
    <Plate>
      <ellipse cx="124" cy="132" rx="62" ry="54" fill="#1C1F1A" opacity="0.10" />
      <path d={blob(120, 122, 62, 0.08, rand, 12)} fill={base} />
      <path d={blob(108, 108, 36, 0.12, rand, 9)} fill={light} opacity="0.75" />
      <ellipse
        cx="100"
        cy="96"
        rx="12"
        ry="7"
        fill="#FFFFFF"
        opacity="0.25"
        transform="rotate(-30 100 96)"
      />
      {Array.from({ length: 34 }, (_, i) => {
        const [x, y] = inCircle(120, 122, 54, rand);
        return (
          <circle key={i} cx={x} cy={y} r={r1(0.7 + rand() * 0.8)} fill={speck} opacity="0.7" />
        );
      })}
    </Plate>
  );
}

function Jollof() {
  const rand = rng(11);
  return (
    <Plate>
      <path d={blob(120, 120, 70, 0.14, rand, 14)} fill="#C9482A" />
      <path d={blob(112, 112, 50, 0.16, rand, 11)} fill="#DB6436" opacity="0.8" />
      {Array.from({ length: 120 }, (_, i) => {
        const [x, y] = inCircle(120, 120, 64, rand);
        const fill = rand() > 0.35 ? "#F09A62" : "#A8361C";
        return (
          <ellipse
            key={i}
            cx={x}
            cy={y}
            rx="3.4"
            ry="1.4"
            fill={fill}
            opacity="0.9"
            transform={`rotate(${Math.round(rand() * 180)} ${x} ${y})`}
          />
        );
      })}
      {Array.from({ length: 7 }, (_, i) => {
        const [x, y] = inCircle(120, 120, 52, rand);
        return <circle key={`p${i}`} cx={x} cy={y} r="3.2" fill="#7FA33A" />;
      })}
      {Array.from({ length: 6 }, (_, i) => {
        const [x, y] = inCircle(120, 120, 52, rand);
        return <rect key={`c${i}`} x={x} y={y} width="5" height="5" rx="1" fill="#F2A33A" />;
      })}
    </Plate>
  );
}

function Egusi() {
  const rand = rng(23);
  return (
    <>
      <circle cx="122" cy="126" r="106" fill="#1C1F1A" opacity="0.12" />
      <circle cx="120" cy="120" r="106" fill="#6B4430" />
      <circle cx="120" cy="120" r="94" fill="#4A2E21" />
      <circle cx="120" cy="120" r="88" fill="#C99A26" />
      <path d={blob(116, 114, 60, 0.2, rand, 10)} fill="#D9AE3C" opacity="0.8" />
      {Array.from({ length: 30 }, (_, i) => {
        const [x, y] = inCircle(120, 120, 76, rand);
        return <path key={i} d={blob(x, y, 4 + rand() * 6, 0.4, rand, 7)} fill="#EED27A" />;
      })}
      {Array.from({ length: 18 }, (_, i) => {
        const [x, y] = inCircle(120, 120, 72, rand);
        const rot = Math.round(rand() * 180);
        return (
          <path
            key={`l${i}`}
            d={`M${x - 9} ${y}Q${x} ${y - 7} ${x + 9} ${y}Q${x} ${y + 7} ${x - 9} ${y}Z`}
            fill={rand() > 0.5 ? "#2E6A2E" : "#3F8238"}
            transform={`rotate(${rot} ${x} ${y})`}
          />
        );
      })}
      {Array.from({ length: 3 }, (_, i) => {
        const [x, y] = inCircle(120, 120, 50, rand);
        return <path key={`m${i}`} d={blob(x, y, 11, 0.35, rand, 8)} fill="#7A3E26" />;
      })}
      {Array.from({ length: 14 }, (_, i) => {
        const [x, y] = inCircle(120, 120, 80, rand);
        return (
          <circle
            key={`o${i}`}
            cx={x}
            cy={y}
            r={r1(1.5 + rand() * 2.5)}
            fill="#C2491D"
            opacity="0.55"
          />
        );
      })}
    </>
  );
}

function MoiMoi() {
  return (
    <Plate>
      <path d="M40 150Q70 60 180 60Q200 62 205 75Q170 170 52 168Q40 165 40 150Z" fill="#3E7A35" />
      <path d="M48 160Q110 120 196 70" stroke="#2C5C27" strokeWidth="2.5" fill="none" />
      <g transform="rotate(-14 120 118)">
        <ellipse cx="124" cy="128" rx="58" ry="40" fill="#1C1F1A" opacity="0.12" />
        <rect x="64" y="80" width="116" height="80" rx="30" fill="#D06A34" />
        <rect x="72" y="86" width="98" height="40" rx="20" fill="#E0844C" opacity="0.8" />
        <ellipse cx="122" cy="122" rx="20" ry="15" fill="#FBF6EA" />
        <ellipse cx="122" cy="123" rx="9.5" ry="8" fill="#F2B53A" />
        <circle cx="90" cy="134" r="4" fill="#B5522A" opacity="0.6" />
        <circle cx="154" cy="104" r="3.5" fill="#B5522A" opacity="0.6" />
        <circle cx="150" cy="140" r="3" fill="#B5522A" opacity="0.6" />
      </g>
    </Plate>
  );
}

function Plantain() {
  const slices = [
    [82, 92, -30],
    [116, 78, -24],
    [152, 86, -18],
    [70, 128, -36],
    [106, 118, -28],
    [144, 122, -20],
    [178, 124, -14],
    [92, 160, -32],
    [130, 158, -24],
    [166, 158, -16],
  ] as const;
  return (
    <Plate>
      {slices.map(([x, y, rot], i) => (
        <g key={i} transform={`rotate(${rot} ${x} ${y})`}>
          <ellipse cx={x + 1.5} cy={y + 3} rx="21" ry="13" fill="#1C1F1A" opacity="0.10" />
          <ellipse cx={x} cy={y} rx="21" ry="13" fill="#E9A23B" stroke="#A9561B" strokeWidth="3" />
          <ellipse cx={x - 3} cy={y - 2} rx="11" ry="6" fill="#F5C76A" opacity="0.8" />
          <circle cx={x + 7} cy={y + 3} r="2.5" fill="#C46E22" opacity="0.6" />
        </g>
      ))}
    </Plate>
  );
}

function Beans() {
  const rand = rng(37);
  return (
    <Plate>
      <path d={blob(120, 120, 66, 0.12, rand, 12)} fill="#7A3B20" />
      <path d={blob(116, 116, 50, 0.2, rand, 10)} fill="#B4401C" opacity="0.35" />
      {Array.from({ length: 80 }, (_, i) => {
        const [x, y] = inCircle(120, 120, 60, rand);
        const rot = Math.round(rand() * 180);
        return (
          <g key={i} transform={`rotate(${rot} ${x} ${y})`}>
            <ellipse cx={x} cy={y} rx="4.8" ry="3" fill={rand() > 0.5 ? "#9C5631" : "#874827"} />
            <ellipse cx={x - 1.2} cy={y - 0.8} rx="1.6" ry="0.8" fill="#D9A37E" opacity="0.7" />
          </g>
        );
      })}
    </Plate>
  );
}

function Fish() {
  return (
    <Plate>
      <g transform="rotate(-24 120 120)">
        <ellipse cx="116" cy="126" rx="70" ry="30" fill="#1C1F1A" opacity="0.12" />
        <path d="M52 120L28 98L35 120L28 142Z" fill="#7D4A2C" />
        <path
          d="M48 120C70 84 150 80 178 112C185 119 185 124 178 130C150 160 70 156 48 120Z"
          fill="#9A6440"
        />
        <path d="M62 128C90 146 140 148 172 128C150 150 86 152 62 128Z" fill="#C79363" />
        {[78, 98, 118, 138].map((x) => (
          <path
            key={x}
            d={`M${x} 98L${x + 14} 140`}
            stroke="#4A2C1C"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.65"
          />
        ))}
        <circle cx="163" cy="112" r="5.5" fill="#F4EEE2" />
        <circle cx="164" cy="112" r="2.6" fill="#1C1F1A" />
        <path d="M150 100C155 112 155 126 150 138" stroke="#6A3C22" strokeWidth="2" fill="none" />
      </g>
      <circle cx="70" cy="170" r="11" fill="none" stroke="#E8D9EC" strokeWidth="3" />
      <circle cx="84" cy="182" r="9" fill="none" stroke="#E8D9EC" strokeWidth="3" />
      <path d="M172 158Q186 150 194 166Q182 176 172 158Z" fill="#C9302C" />
      <path d="M160 176Q178 172 182 188Q166 192 160 176Z" fill="#7FAF3A" />
    </Plate>
  );
}

const ART: Record<FoodKey, () => ReactNode> = {
  jollof: Jollof,
  egusi: Egusi,
  eba: () => <Dome base="#E6BF57" light="#F3D684" speck="#C99E3A" seed={5} />,
  amala: () => <Dome base="#6B5646" light="#8A7464" speck="#4F3D31" seed={9} />,
  moimoi: MoiMoi,
  plantain: Plantain,
  beans: Beans,
  fish: Fish,
};

/** A dish as an illustration (or the licensed photo, once one is set in FOOD_MEDIA). */
export function FoodArt({
  food,
  className,
  sizes = "240px",
  priority,
}: {
  food: FoodKey;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const media = FOOD_MEDIA[food];
  if (media.photo) {
    return (
      <Image
        src={media.photo}
        alt={media.name}
        width={480}
        height={480}
        sizes={sizes}
        priority={priority}
        className={cn("aspect-square rounded-full object-cover", className)}
      />
    );
  }
  const Art = ART[food];
  return (
    <svg
      viewBox="0 0 240 240"
      role="img"
      aria-label={`Illustration of ${media.name}`}
      className={className}
    >
      <Art />
    </svg>
  );
}

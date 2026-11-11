import { toUserMessage } from "@nutritrack/api-client";
import { useEffect, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
} from "react-native";
import { Button } from "@/components/ui";
import { FONTS, RADIUS, useColors } from "@/lib/theme";

/** The dashboard card surface: a titled section with an optional action on the right. */
export function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const c = useColors();
  return (
    <View style={[styles.panel, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.title, { color: c.foreground }]}>
          {title}
        </Text>
        {action}
      </View>
      {children}
    </View>
  );
}

export function PanelError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const c = useColors();
  return (
    <View accessibilityRole="alert" style={{ gap: 10 }}>
      <Text style={[styles.body, { color: c.destructive }]}>{toUserMessage(error)}</Text>
      <Button label="Try again" variant="outline" onPress={onRetry} />
    </View>
  );
}

/** Pulsing placeholder lines; hidden from screen readers (the panel announces loading). */
export function Skeleton({ lines = 3 }: { lines?: number }) {
  const c = useColors();
  const [opacity] = useState(() => new Animated.Value(0.5));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    let active = true;
    // Respect the system "reduce motion" setting: keep a static placeholder instead.
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (active && !reduce) loop.start();
    });
    return () => {
      active = false;
      loop.stop();
    };
  }, [opacity]);
  const widths: DimensionValue[] = ["55%", "100%", "80%", "92%", "70%"];
  return (
    <View
      accessible
      accessibilityLabel="Loading"
      accessibilityLiveRegion="polite"
      style={{ gap: 10 }}
    >
      {Array.from({ length: lines }, (_, i) => (
        <Animated.View
          key={i}
          style={{
            height: 14,
            width: widths[i % widths.length],
            borderRadius: 7,
            backgroundColor: c.surface,
            opacity,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: 1, borderRadius: RADIUS.lg + 4, padding: 18, gap: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  title: { fontSize: 18, fontFamily: FONTS.headingSemibold },
  body: { fontSize: 15, fontFamily: FONTS.body },
});

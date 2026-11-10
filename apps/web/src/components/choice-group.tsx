"use client";

import { useId } from "react";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type Choice<T extends string> = { value: T; label: string; description?: string };

/** Accessible single-choice question: a fieldset with labelled radio options. */
export function ChoiceGroup<T extends string>({
  legend,
  choices,
  value,
  onChange,
  error,
}: {
  legend: string;
  choices: Choice<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  error?: string | undefined;
}) {
  const id = useId();
  return (
    <FieldSet data-invalid={Boolean(error) || undefined}>
      <FieldLegend variant="label">{legend}</FieldLegend>
      <RadioGroup
        value={value ?? null}
        onValueChange={(v) => onChange(v as T)}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${id}-err` : undefined}
      >
        {choices.map((choice) => (
          <FieldLabel key={choice.value} htmlFor={`${id}-${choice.value}`}>
            <Field orientation="horizontal">
              <RadioGroupItem id={`${id}-${choice.value}`} value={choice.value} />
              <FieldContent>
                <span className="font-medium">{choice.label}</span>
                {choice.description && <FieldDescription>{choice.description}</FieldDescription>}
              </FieldContent>
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
      {error && <FieldError id={`${id}-err`}>{error}</FieldError>}
    </FieldSet>
  );
}

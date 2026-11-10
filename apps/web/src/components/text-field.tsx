import { useId, type ComponentProps } from "react";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Props = Omit<ComponentProps<typeof Input>, "id"> & {
  label: string;
  error?: string | undefined;
  description?: string;
};

/** Labelled input with description and error wired up for screen readers. */
export function TextField({ label, error, description, ...inputProps }: Props) {
  const id = useId();
  const describedBy = [description && `${id}-desc`, error && `${id}-err`].filter(Boolean).join(" ");
  return (
    <Field data-invalid={Boolean(error) || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy || undefined}
        {...inputProps}
      />
      {description && <FieldDescription id={`${id}-desc`}>{description}</FieldDescription>}
      {error && <FieldError id={`${id}-err`}>{error}</FieldError>}
    </Field>
  );
}

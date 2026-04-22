import { useId } from "react";
import { Field, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { type WritableAtom, useAtom } from "jotai";

// Creates a text input or textarea field with an error message that can be
// displayed if validation fails.
export function ErrableTextInputField({
  kind: Component,
  description,
  placeholder,
  valueAtom,
  errorMsg,
}: {
  kind: typeof Input | typeof Textarea;
  description: string;
  placeholder?: string;
  valueAtom: WritableAtom<string, [string], void>;
  errorMsg?: string;
}) {
  const [value, setValue] = useAtom(valueAtom);
  const id = useId();
  return (
    <Field data-invalid={!!errorMsg}>
      <FieldLabel htmlFor={id}>{errorMsg ?? description}</FieldLabel>
      <Component
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-invalid={!!errorMsg}
      />
    </Field>
  );
}

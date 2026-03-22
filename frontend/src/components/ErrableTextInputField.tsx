import { Field, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

// Creates a text input or textarea field with an error message that can be
// displayed if validation fails.
export default function ErrableTextInputField({
  kind,
  id,
  description,
  placeholder,
  value,
  onChange,
  hasError,
  errorMsg,
}: {
  kind: "input" | "textarea";
  id: string;
  description: string;
  placeholder?: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  hasError: boolean;
  errorMsg: string;
}) {
  return (
    <Field data-invalid={hasError}>
      <FieldLabel htmlFor={id}>{hasError ? errorMsg : description}</FieldLabel>
      {kind === "input" ? (
        <Input
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          aria-invalid={hasError}
        />
      ) : (
        <Textarea
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          aria-invalid={hasError}
        />
      )}
    </Field>
  );
}

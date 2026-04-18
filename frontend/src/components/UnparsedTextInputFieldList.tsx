import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Dispatch, SetStateAction, useState } from "react";

// Creates a text input or textarea field with an error message that can be
// displayed if validation fails.
export function UnparsedTextInputFieldList({
  placeholder,
  listItemPlaceholder,
  items,
  setItems,
}: {
  placeholder?: string;
  listItemPlaceholder?: string;
  items: string[];
  setItems: Dispatch<SetStateAction<string[]>>;
}) {
  const [value, setValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim() !== "") {
      setItems([...items, value.trim()]);
      setValue("");
    }
  };

  return (
    <>
      {items.map((it, i) => (
        <Field key={i}>
          <Input
            placeholder={listItemPlaceholder}
            value={it}
            onChange={(e) => {
              const newItems = [...items];
              newItems[i] = e.target.value;
              setItems(newItems);
            }}
          />
        </Field>
      ))}
      <Field>
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </Field>
    </>
  );
}

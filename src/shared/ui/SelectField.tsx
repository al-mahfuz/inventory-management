import type { SelectHTMLAttributes } from "react";

export type SelectOption = { label: string; value: string };

export function SelectField({
  label,
  options,
  placeholder,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: SelectOption[]; placeholder?: string }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <select {...props}>
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

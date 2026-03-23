import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

const inputClass =
  "w-full min-h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-2 sm:py-1.5 sm:text-sm"

export function InlineHint({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <p id={id} className="mt-0.5 text-xs leading-snug text-muted-foreground">
      {children}
    </p>
  )
}

export function FieldGroup({
  label,
  hint,
  hintId,
  htmlFor,
  children,
  className,
}: {
  label: string
  hint?: ReactNode
  hintId?: string
  htmlFor?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium text-foreground/90"
      >
        {label}
      </label>
      {children}
      {hint ? <InlineHint id={hintId}>{hint}</InlineHint> : null}
    </div>
  )
}

export function TextField({
  id,
  label,
  hint,
  value,
  onValueChange,
  className,
  "data-testid": testId,
}: {
  id: string
  label: string
  hint?: ReactNode
  value: string
  onValueChange: (next: string) => void
  className?: string
  "data-testid"?: string
}) {
  const hintId = hint ? `${id}-hint` : undefined
  return (
    <FieldGroup label={label} hint={hint} hintId={hintId} htmlFor={id}>
      <input
        id={id}
        type="text"
        data-testid={testId}
        className={cn(inputClass, className)}
        value={value}
        aria-describedby={hintId}
        onChange={(e) => onValueChange(e.target.value)}
      />
    </FieldGroup>
  )
}

export function TextAreaField({
  id,
  label,
  hint,
  value,
  onValueChange,
  rows = 3,
  "data-testid": testId,
}: {
  id: string
  label: string
  hint?: ReactNode
  value: string
  onValueChange: (next: string) => void
  rows?: number
  "data-testid"?: string
}) {
  const hintId = hint ? `${id}-hint` : undefined
  return (
    <FieldGroup label={label} hint={hint} hintId={hintId} htmlFor={id}>
      <textarea
        id={id}
        data-testid={testId}
        rows={rows}
        className={cn(inputClass, "min-h-[4.5rem] resize-y")}
        value={value}
        aria-describedby={hintId}
        onChange={(e) => onValueChange(e.target.value)}
      />
    </FieldGroup>
  )
}

export function NumberField({
  id,
  label,
  hint,
  value,
  onValueChange,
  step,
  min,
  max,
  "data-testid": testId,
}: {
  id: string
  label: string
  hint?: ReactNode
  value: number
  onValueChange: (next: number) => void
  step?: number | string
  min?: number
  max?: number
  "data-testid"?: string
}) {
  const hintId = hint ? `${id}-hint` : undefined
  return (
    <FieldGroup label={label} hint={hint} hintId={hintId} htmlFor={id}>
      <input
        id={id}
        type="number"
        data-testid={testId}
        className={inputClass}
        step={step}
        min={min}
        max={max}
        aria-describedby={hintId}
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => {
          const raw = e.target.value.trim()
          let v = e.target.valueAsNumber
          if (!Number.isFinite(v) && raw !== "") {
            v = parseFloat(e.target.value)
          }
          if (Number.isFinite(v)) onValueChange(v)
        }}
      />
    </FieldGroup>
  )
}

export function OptionalNumberField({
  id,
  label,
  hint,
  value,
  onValueChange,
  step,
  placeholder = "Auto (band)",
  "data-testid": testId,
}: {
  id: string
  label: string
  hint?: ReactNode
  value: number | null
  onValueChange: (next: number | null) => void
  step?: number | string
  placeholder?: string
  "data-testid"?: string
}) {
  const hintId = hint ? `${id}-hint` : undefined
  return (
    <FieldGroup label={label} hint={hint} hintId={hintId} htmlFor={id}>
      <input
        id={id}
        type="number"
        data-testid={testId}
        className={inputClass}
        step={step}
        placeholder={placeholder}
        aria-describedby={hintId}
        value={value === null || value === undefined ? "" : value}
        onChange={(e) => {
          const raw = e.target.value
          if (raw.trim() === "") {
            onValueChange(null)
            return
          }
          const v = e.target.valueAsNumber
          if (Number.isFinite(v)) onValueChange(v)
        }}
      />
    </FieldGroup>
  )
}

export function SelectField<T extends string>({
  id,
  label,
  hint,
  value,
  onValueChange,
  options,
  "data-testid": testId,
}: {
  id: string
  label: string
  hint?: ReactNode
  value: T
  onValueChange: (next: T) => void
  options: { value: T; label: string }[]
  "data-testid"?: string
}) {
  const hintId = hint ? `${id}-hint` : undefined
  return (
    <FieldGroup label={label} hint={hint} hintId={hintId} htmlFor={id}>
      <select
        id={id}
        data-testid={testId}
        className={inputClass}
        aria-describedby={hintId}
        value={value}
        onChange={(e) => onValueChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldGroup>
  )
}

export function CheckboxField({
  id,
  label,
  hint,
  checked,
  onCheckedChange,
  "data-testid": testId,
}: {
  id: string
  label: string
  hint?: ReactNode
  checked: boolean
  onCheckedChange: (next: boolean) => void
  "data-testid"?: string
}) {
  const hintId = hint ? `${id}-hint` : undefined
  return (
    <div className="flex flex-col gap-1">
      <div className="flex min-h-11 items-center gap-3">
        <input
          id={id}
          type="checkbox"
          data-testid={testId}
          className="size-5 shrink-0 rounded border-input sm:size-4"
          checked={checked}
          aria-describedby={hintId}
          onChange={(e) => onCheckedChange(e.target.checked)}
        />
        <label htmlFor={id} className="text-sm font-medium text-foreground/90">
          {label}
        </label>
      </div>
      {hint ? <InlineHint id={hintId}>{hint}</InlineHint> : null}
    </div>
  )
}

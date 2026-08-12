import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const fieldClass =
  'w-full rounded-cc-md bg-cc-surface px-3.5 py-2.5 text-cc-ink ring-1 ring-cc-border placeholder:text-cc-muted focus:ring-2 focus:ring-cc-accent'

export function TextField({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex w-full flex-col gap-1.5">
      <span className="text-sm font-semibold text-cc-ink-secondary">{label}</span>
      <input className={cn(fieldClass, className)} {...props} />
    </label>
  )
}

export function TextAreaField({
  label,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="flex w-full flex-col gap-1.5">
      <span className="text-sm font-semibold text-cc-ink-secondary">{label}</span>
      <textarea className={cn(fieldClass, 'min-h-24 resize-y', className)} {...props} />
    </label>
  )
}

export function SelectField({
  label,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="flex w-full flex-col gap-1.5">
      <span className="text-sm font-semibold text-cc-ink-secondary">{label}</span>
      <select className={cn(fieldClass, className)} {...props}>
        {children}
      </select>
    </label>
  )
}

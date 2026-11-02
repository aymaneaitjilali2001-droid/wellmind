import { useId, type SelectHTMLAttributes } from 'react';
import { NativeSelect } from '@/components/Nativeselect';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
};

// Liste déroulante complète : libellé, aide et erreur (équivalent de FormField pour un select)
export function SelectField({ label, error, hint, optional, id, className, children, ...selectProps }: SelectFieldProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const hintId = `${selectId}-hint`;
  const errorId = `${selectId}-error`;
  const describedBy = [hint && !error ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={selectId}>
        {label}
        {optional && <span className="font-normal text-muted-foreground">(facultatif)</span>}
      </Label>
      <NativeSelect
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...selectProps}
      >
        {children}
      </NativeSelect>
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
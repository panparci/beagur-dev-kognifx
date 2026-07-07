import { useId, useState } from 'react';
import { Pencil } from 'lucide-react';
import { beaInput, beaTextarea } from '@core/ui/beaTheme';

type CmsEditableProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  className?: string;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3';
};

export function CmsEditable({
  label,
  value,
  onChange,
  multiline = false,
  className = '',
  as: Tag = 'span',
}: CmsEditableProps) {
  const [open, setOpen] = useState(false);
  const fieldId = useId();

  if (open) {
    return (
      <div className="cms-editable-popover">
        <label htmlFor={fieldId} className="cms-editable-popover__label">
          {label}
        </label>
        {multiline ? (
          <textarea
            id={fieldId}
            className={beaTextarea}
            rows={3}
            value={value}
            autoFocus
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
            }}
          />
        ) : (
          <input
            id={fieldId}
            className={beaInput}
            value={value}
            autoFocus
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <Tag className={`cms-editable ${className}`.trim()}>
      <span className="cms-editable__text">{value || `— ${label} —`}</span>
      <button
        type="button"
        className="cms-editable__pencil"
        onClick={() => setOpen(true)}
        aria-label={`Ubah ${label}`}
      >
        <Pencil size={11} aria-hidden />
      </button>
    </Tag>
  );
}

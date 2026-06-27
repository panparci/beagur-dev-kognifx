import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { beaInput } from '@core/ui/beaTheme';
import { EyeIcon } from '@core/ui/icons/EyeIcon';
import { EyeOffIcon } from '@core/ui/icons/EyeOffIcon';

type PasswordInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  variant?: 'default' | 'underline';
};

export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete = 'current-password',
  placeholder = '••••••••',
  required = true,
  variant = 'default',
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const isUnderline = variant === 'underline';

  const inputClass = isUnderline
    ? 'auth-underline-input'
    : `${beaInput} auth-input-with-icon auth-input-with-toggle`;

  const wrapperClass = isUnderline ? 'auth-underline-control' : 'auth-input-group';
  const iconClass = isUnderline ? 'auth-underline-icon' : 'auth-input-group-icon';
  const toggleClass = isUnderline ? 'auth-underline-toggle' : 'auth-input-toggle';

  return (
    <div className={wrapperClass}>
      <Lock className={iconClass} size={18} aria-hidden />
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
      <button
        type="button"
        className={toggleClass}
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
        aria-pressed={visible}
      >
        {visible ? (
          <EyeOffIcon size={18} className="auth-input-toggle-icon" />
        ) : (
          <EyeIcon size={18} className="auth-input-toggle-icon" />
        )}
      </button>
    </div>
  );
}

import React, { useId, useState } from 'react';

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  rightAffordance?: React.ReactNode;
  textarea?: boolean;
};

export function FloatingLabelInput({ label, value, onChange, type = 'text', rightAffordance, textarea }: Props) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const showFloat = focused || value.length > 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <label
            htmlFor={id}
            className={showFloat ? 'block text-xs font-semibold opacity-70 mb-1' : 'block text-xs font-semibold opacity-0 h-0'}
          >
            {label}
          </label>
          {textarea ? (
            <textarea
              id={id}
              value={value}
              placeholder={showFloat ? '' : label}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="w-full resize-none outline-none text-base text-[#111827]"
              rows={5}
            />
          ) : (
            <input
              id={id}
              value={value}
              placeholder={showFloat ? '' : label}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              type={type}
              className="w-full outline-none text-base text-[#111827]"
            />
          )}
        </div>
        {rightAffordance ? <div className="pt-1">{rightAffordance}</div> : null}
      </div>
    </div>
  );
}

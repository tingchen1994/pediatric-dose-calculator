import type { ReactNode } from 'react';
import { IconWarning } from './Icons';

export type WarningVariant = 'danger' | 'warning' | 'info';

interface WarningBoxProps {
  variant: WarningVariant;
  title?: string;
  children: ReactNode;
}

const STYLES: Record<
  WarningVariant,
  { wrap: string; icon: string; title: string; text: string }
> = {
  danger: {
    wrap: 'border-red-300 bg-red-50',
    icon: 'text-red-600',
    title: 'text-red-900',
    text: 'text-red-800',
  },
  warning: {
    wrap: 'border-amber-300 bg-amber-50',
    icon: 'text-amber-600',
    title: 'text-amber-900',
    text: 'text-amber-800',
  },
  info: {
    wrap: 'border-sky-300 bg-sky-50',
    icon: 'text-sky-600',
    title: 'text-sky-900',
    text: 'text-sky-800',
  },
};

/**
 * 警告框：图标 + 颜色 + 文字三重提示，不只依赖颜色。
 * danger 对应超限类必须人工复核的警告；warning 对 counterpart 校验类警告；info 为说明。
 */
export function WarningBox({ variant, title, children }: WarningBoxProps) {
  const s = STYLES[variant];
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${s.wrap}`}
      role={variant === 'danger' ? 'alert' : 'note'}
    >
      <IconWarning
        className={`mt-0.5 h-5 w-5 flex-shrink-0 ${s.icon}`}
        aria-hidden="true"
      />
      <div className={`min-w-0 text-sm leading-relaxed ${s.text}`}>
        {title && <p className={`font-semibold ${s.title}`}>{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}

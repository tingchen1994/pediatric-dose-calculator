import { IconWarning } from './Icons';
import { SAFETY_DISCLAIMER } from '../utils/safety';

/** 顶部常驻安全声明横幅（页面所有页面可见） */
export function SafetyBanner() {
  return (
    <div
      className="no-print border-b border-amber-200 bg-amber-50"
      role="note"
      aria-label="安全声明"
    >
      <div className="mx-auto flex max-w-6xl items-start gap-2.5 px-4 py-2.5">
        <IconWarning className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
        <p className="text-sm font-medium leading-relaxed text-amber-900">
          {SAFETY_DISCLAIMER}
        </p>
      </div>
    </div>
  );
}

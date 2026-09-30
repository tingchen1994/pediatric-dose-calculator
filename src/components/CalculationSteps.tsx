import type { CalcStep } from '../types';
import { formatNumber, formatRawValue } from '../utils/format';
import { IconChevron } from './Icons';

interface CalculationStepsProps {
  steps: CalcStep[];
}

/**
 * 「完整计算过程」折叠面板：逐步展示公式、代入数值、单位变化，
 * 并同时给出未提前舍入的原始值与格式化显示值。
 */
export function CalculationSteps({ steps }: CalculationStepsProps) {
  return (
    <details className="group rounded-lg border border-slate-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50">
        <span>展开完整计算过程（{steps.length} 步 · 含公式与单位换算）</span>
        <IconChevron className="h-4 w-4 flex-shrink-0 text-slate-500 transition-transform group-open:rotate-180" />
      </summary>
      <ol className="divide-y divide-slate-100 border-t border-slate-100">
        {steps.map((s, i) => (
          <li key={i} className="px-4 py-3">
            <p className="text-xs font-medium text-slate-500">
              步骤 {i + 1} · {s.label}
            </p>
            <p className="mt-1 break-all font-num text-sm text-slate-800">
              {s.expression}
            </p>
            {s.value !== null && (
              <p className="mt-1 text-xs text-slate-500">
                未提前舍入原始值：
                <span className="font-num text-slate-700">
                  {formatRawValue(s.value)} {s.unit ?? ''}
                </span>
                <span className="mx-1.5 text-slate-300">|</span>
                显示值（舍入）：
                <span className="font-num text-slate-700">
                  {formatNumber(s.value, 3)} {s.unit ?? ''}
                </span>
              </p>
            )}
          </li>
        ))}
      </ol>
      <p className="border-t border-slate-100 px-4 py-3 text-xs leading-relaxed text-slate-500">
        计算说明：全部计算使用未提前四舍五入的中间值（包括 BSA），仅在最终展示时按需保留小数位；
        舍入不改变数学计算结果，也不改变超限判定与差值。液体体积不会自动四舍五入到量具刻度。
      </p>
    </details>
  );
}

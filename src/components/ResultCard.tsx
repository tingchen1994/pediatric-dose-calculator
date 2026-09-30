import { useState } from 'react';
import type { ComputedResult } from '../types';
import { MODE_LABELS, doseParamUnit } from '../utils/calc';
import {
  formatAge,
  formatDateTime,
  formatNumber,
  formatRawValue,
} from '../utils/format';
import {
  DAILY_MAX_WARNING,
  FICTIONAL_NOTE,
  SINGLE_MAX_WARNING,
  SOURCE_MISSING_WARNING,
  UNREVIEWED_WARNING,
  VOLUME_NOTE,
  getSafetyFlags,
} from '../utils/safety';
import { CalculationSteps } from './CalculationSteps';
import { IconCheck, IconCopy, IconPrinter, IconShield } from './Icons';
import { WarningBox } from './WarningBox';

interface ResultCardProps {
  result: ComputedResult;
  computedAt: string;
  onCopy: () => void;
  onPrint: () => void;
}

function InfoCell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 break-all text-sm font-medium text-slate-900">
        {children}
      </p>
    </div>
  );
}

function MaxCompareRow({
  title,
  calcValue,
  unit,
  max,
  exceeded,
  diff,
}: {
  title: string;
  calcValue: number;
  unit: string;
  max: number | null;
  exceeded: boolean;
  diff: number | null;
}) {
  if (max === null && !exceeded) return null;
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500">
          <tr>
            <th className="px-3 py-2 font-medium">{title} 比较</th>
            <th className="px-3 py-2 font-medium">原始数学计算结果</th>
            <th className="px-3 py-2 font-medium">人工录入上限</th>
            <th className="px-3 py-2 font-medium">差值</th>
            <th className="px-3 py-2 font-medium">状态</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          <tr className={exceeded ? 'bg-red-50' : ''}>
            <td className="px-3 py-2 font-medium text-slate-700">数值</td>
            <td className="px-3 py-2 font-num text-slate-900">
              {formatRawValue(calcValue)} {unit}
            </td>
            <td className="px-3 py-2 font-num text-slate-900">
              {max === null ? '—' : `${formatNumber(max, 3)} ${unit}`}
            </td>
            <td className="px-3 py-2 font-num text-slate-900">
              {exceeded && diff !== null
                ? `+${formatRawValue(diff)} ${unit}`
                : '—（未超限）'}
            </td>
            <td className="px-3 py-2">
              {exceeded ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                  ⚠ 需要专业复核
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                  <IconCheck className="h-3 w-3" />
                  未超限
                </span>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function ResultCard({
  result,
  computedAt,
  onCopy,
  onPrint,
}: ResultCardProps) {
  const [copied, setCopied] = useState(false);
  const flags = getSafetyFlags(result);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      id="result-card"
      className="print-card rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      aria-label="计算结果卡片"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">数学计算结果</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            计算模式：{MODE_LABELS[result.calcMode]}
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
            flags.needsReview
              ? 'bg-red-100 text-red-700'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {flags.needsReview ? '待复核结果 · 需要专业复核' : '待复核结果'}
        </span>
      </div>

      {/* 超限红色警告（图标 + 颜色 + 文字） */}
      {result.singleExceeded && (
        <div className="mt-4">
          <WarningBox variant="danger" title="单次剂量超限警告">
            {SINGLE_MAX_WARNING}
          </WarningBox>
        </div>
      )}
      {result.dailyExceeded && (
        <div className="mt-4">
          <WarningBox variant="danger" title="每日剂量超限警告">
            {DAILY_MAX_WARNING}
          </WarningBox>
        </div>
      )}

      {/* 来源缺失 / 未审核模板警告 */}
      {flags.sourceMissing && (
        <div className="mt-4">
          <WarningBox variant="warning" title="剂量参数来源未填写">
            {SOURCE_MISSING_WARNING}
          </WarningBox>
        </div>
      )}
      {flags.unreviewed && (
        <div className="mt-4">
          <WarningBox variant="warning" title="未审核模板">
            {UNREVIEWED_WARNING}
          </WarningBox>
        </div>
      )}
      {flags.fictional && (
        <div className="mt-4">
          <WarningBox variant="warning" title="虚构演示数据">
            当前使用「{result.templateName}」——{FICTIONAL_NOTE}。
          </WarningBox>
        </div>
      )}

      {/* 输入核对提醒（不作为医学判断） */}
      {result.inputWarnings.length > 0 && (
        <div className="mt-4">
          <WarningBox variant="warning" title="录入值核对提醒（不作为医学判断）">
            <ul className="list-disc space-y-1 pl-5">
              {result.inputWarnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </WarningBox>
        </div>
      )}

      {/* 输入与换算 */}
      <div className="mt-5">
        <h3 className="text-sm font-semibold text-slate-700">
          一、输入信息与单位换算
        </h3>
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <InfoCell label="年龄（仅记录与风险提示）">
            {formatAge(result.ageYears, result.ageMonths)}
          </InfoCell>
          <InfoCell label={`体重（原始输入：${result.weightUnit} → 内部统一换算 kg）`}>
            {formatNumber(result.weightInput, 2)} {result.weightUnit} ={' '}
            {formatNumber(result.weightKg, 3)} kg
          </InfoCell>
          {result.heightInput !== null ? (
            <InfoCell label={`身高（原始输入：${result.heightUnit} → 内部统一换算 cm）`}>
              {formatNumber(result.heightInput, 2)} {result.heightUnit} ={' '}
              {formatNumber(result.heightCm, 2)} cm
            </InfoCell>
          ) : (
            <InfoCell label="身高">未填写（体重模式不参与计算）</InfoCell>
          )}
          {result.bsa !== null && (
            <InfoCell label="体表面积 BSA（Mosteller，显示保留 3 位小数）">
              {formatNumber(result.bsa, 3, 3)} m²
              <span className="ml-1 text-xs font-normal text-slate-500">
                （未舍入原始值 {formatRawValue(result.bsa)} m²）
              </span>
            </InfoCell>
          )}
        </div>
      </div>

      {/* 人工录入的剂量参数 */}
      <div className="mt-5">
        <h3 className="text-sm font-semibold text-slate-700">
          二、人工录入的剂量参数
        </h3>
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <InfoCell label="药物模板名称">{result.templateName}</InfoCell>
          <InfoCell label={`剂量参数（${doseParamUnit(result.calcMode)}）`}>
            {formatNumber(result.dosePerUnit, 4)} {doseParamUnit(result.calcMode)}
          </InfoCell>
          <InfoCell label="每日给药次数">{result.timesPerDay} 次/日</InfoCell>
          <InfoCell label="制剂浓度">
            {result.concentration === null
              ? '未提供'
              : `${formatNumber(result.concentration, 3)} mg/mL`}
          </InfoCell>
          <InfoCell label="单次最大剂量（人工录入）">
            {result.maxSingleDose === null
              ? '未设置'
              : `${formatNumber(result.maxSingleDose, 3)} mg/次`}
          </InfoCell>
          <InfoCell label="每日最大剂量（人工录入）">
            {result.maxDailyDose === null
              ? '未设置'
              : `${formatNumber(result.maxDailyDose, 3)} mg/日`}
          </InfoCell>
        </div>
        {result.notes && (
          <p className="mt-2 text-xs text-slate-500">备注：{result.notes}</p>
        )}
      </div>

      {/* 数学计算结果 */}
      <div className="mt-5">
        <h3 className="text-sm font-semibold text-slate-700">
          三、数学计算结果
        </h3>
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2.5">
            <p className="text-xs text-teal-700">单次数学计算剂量</p>
            <p className="mt-0.5 font-num text-lg font-bold text-teal-900">
              {formatNumber(result.singleDose, 3)} mg/次
            </p>
            <p className="text-xs text-teal-600">
              未舍入原始值 {formatRawValue(result.singleDose)} mg/次
            </p>
          </div>
          <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2.5">
            <p className="text-xs text-teal-700">每日数学计算总量</p>
            <p className="mt-0.5 font-num text-lg font-bold text-teal-900">
              {formatNumber(result.dailyDose, 3)} mg/日
            </p>
            <p className="text-xs text-teal-600">
              未舍入原始值 {formatRawValue(result.dailyDose)} mg/日
            </p>
          </div>
          {result.volumePerDose !== null && (
            <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2.5 sm:col-span-2">
              <p className="text-xs text-teal-700">每次液体体积（mg ÷ mg/mL）</p>
              <p className="mt-0.5 font-num text-lg font-bold text-teal-900">
                {formatNumber(result.volumePerDose, 3)} mL/次
              </p>
              <p className="text-xs text-teal-600">
                未舍入原始计算值 {formatRawValue(result.volumePerDose)} mL/次 ·{' '}
                {VOLUME_NOTE}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 最大剂量比较 */}
      <div className="mt-5">
        <h3 className="text-sm font-semibold text-slate-700">
          四、最大剂量比较（超出时不自动修正）
        </h3>
        <div className="mt-3 space-y-2.5">
          <MaxCompareRow
            title="单次剂量"
            calcValue={result.singleDose}
            unit="mg/次"
            max={result.maxSingleDose}
            exceeded={result.singleExceeded}
            diff={result.singleExceedDiff}
          />
          <MaxCompareRow
            title="每日剂量"
            calcValue={result.dailyDose}
            unit="mg/日"
            max={result.maxDailyDose}
            exceeded={result.dailyExceeded}
            diff={result.dailyExceedDiff}
          />
        </div>
      </div>

      {/* 数据来源与审核状态 */}
      <div className="mt-5">
        <h3 className="text-sm font-semibold text-slate-700">五、数据来源与审核</h3>
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <InfoCell label="数据来源">
            {result.source || (
              <span className="text-red-600">未填写（见上方警告）</span>
            )}
          </InfoCell>
          <InfoCell label="来源版本或发布日期">
            {result.sourceVersion || '未填写'}
          </InfoCell>
          <InfoCell label="模板审核状态">
            <span
              className={
                result.reviewStatus === '已审核'
                  ? 'inline-flex items-center gap-1 font-semibold text-teal-700'
                  : 'inline-flex items-center gap-1 font-semibold text-red-600'
              }
            >
              {result.reviewStatus === '已审核'
                ? '✓ 已审核'
                : '⚠ 未审核（显著警告）'}
            </span>
          </InfoCell>
          <InfoCell label="计算时间">
            {formatDateTime(computedAt)}
          </InfoCell>
        </div>
      </div>

      {/* 完整计算过程 */}
      <div className="mt-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">
          六、完整计算过程
        </h3>
        <CalculationSteps steps={result.steps} />
      </div>

      {/* 操作按钮 */}
      <div className="no-print mt-6 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
        >
          <IconCopy className="h-4 w-4" />
          {copied ? '已复制（含安全声明与数据来源）' : '复制结果'}
        </button>
        <button
          type="button"
          onClick={onPrint}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <IconPrinter className="h-4 w-4" />
          打印结果
        </button>
      </div>

      {/* 安全声明 */}
      <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-slate-50 px-4 py-3">
        <IconShield className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-600" />
        <p className="text-xs leading-relaxed text-slate-600">
          <span className="font-semibold">安全声明：</span>
          本工具仅用于教学演示和剂量计算复核，不能替代医生、药师判断，不可直接用于自行给儿童用药。
          以上为「数学计算结果 / 待复核结果」，不构成诊断、处方或用药建议；
          不得仅凭年龄、体重或体表面积给出「可以服用」或「建议服用」的结论。
        </p>
      </div>
    </section>
  );
}

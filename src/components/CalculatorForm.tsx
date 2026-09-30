import type { ReactNode } from 'react';
import type { CalcFormState, DrugTemplate, WeightUnit } from '../types';
import type { FieldErrors } from '../utils/validation';
import {
  DOSE_PARAM_LABELS,
  MODE_OPTIONS,
  modeBasis,
} from '../utils/calc';
import { inchToCm, lbToKg } from '../utils/calc';
import { formatNumber } from '../utils/format';
import { parseNumber } from '../utils/validation';
import { IconReset } from './Icons';

interface CalculatorFormProps {
  value: CalcFormState;
  errors: FieldErrors;
  templates: DrugTemplate[];
  hasResult: boolean;
  onChange: (patch: Partial<CalcFormState>) => void;
  onTemplateChange: (templateId: string) => void;
  onSubmit: () => void;
  onReset: () => void;
}

const UNIT_SELECT_CLASS =
  'rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500';
const INPUT_CLASS =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500';
const INPUT_ERROR_CLASS =
  'w-full rounded-lg border border-red-400 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500';
const LABEL_CLASS = 'mb-1.5 block text-sm font-medium text-slate-700';

function FieldRow({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={LABEL_CLASS}>
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className="h-3.5 w-3.5 flex-shrink-0"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

function weightKgPreview(value: string, unit: WeightUnit): string | null {
  const n = parseNumber(value);
  if (n === null) return null;
  const kg = unit === 'lb' ? lbToKg(n) : n;
  if (unit === 'lb') {
    return `已换算：${formatNumber(n, 2)} lb = ${formatNumber(kg, 3)} kg`;
  }
  return `体重（kg）：${formatNumber(kg, 3)} kg`;
}

function heightCmPreview(
  value: string,
  unit: 'cm' | 'inch',
): string | null {
  const n = parseNumber(value);
  if (n === null) return null;
  const cm = unit === 'inch' ? inchToCm(n) : n;
  if (unit === 'inch') {
    return `已换算：${formatNumber(n, 2)} inch = ${formatNumber(cm, 3)} cm`;
  }
  return `身高（cm）：${formatNumber(cm, 3)} cm`;
}

export function CalculatorForm({
  value,
  errors,
  templates,
  hasResult,
  onChange,
  onTemplateChange,
  onSubmit,
  onReset,
}: CalculatorFormProps) {
  const basisIsBsa = modeBasis(value.calcMode) === 'bsa';

  // 计算按钮状态：必填项缺失时禁用
  const requiredMissing =
    parseNumber(value.weight) === null ||
    parseNumber(value.dosePerUnit) === null ||
    parseNumber(value.timesPerDay) === null ||
    (basisIsBsa && parseNumber(value.height) === null);

  return (
    <form
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      noValidate
    >
      <h2 className="text-lg font-bold text-slate-900">剂量计算输入</h2>
      <p className="mt-1 text-sm text-slate-500">
        模板仅用于自动填充人工录入的参数；本项目不会根据药物名称自动生成剂量。
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldRow htmlFor="f-template" label="演示药物模板" hint="选择后自动填充参数，可在下方逐项修改">
          <select
            id="f-template"
            className={INPUT_CLASS}
            value={value.templateId}
            onChange={(e) => onTemplateChange(e.target.value)}
          >
            {templates
              .filter((t) => t.builtin)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.fictional ? '（虚构演示数据）' : ''}
                </option>
              ))}
            {templates.some((t) => !t.builtin && t.id.startsWith('real-')) && (
              <optgroup label="院内资料导入（未审核，需核对后使用）">
                {templates
                  .filter((t) => !t.builtin && t.id.startsWith('real-'))
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </optgroup>
            )}
            {templates.some(
              (t) => !t.builtin && !t.id.startsWith('real-'),
            ) && (
              <optgroup label="我的自定义模板">
                {templates
                  .filter((t) => !t.builtin && !t.id.startsWith('real-'))
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </optgroup>
            )}
          </select>
        </FieldRow>

        <FieldRow htmlFor="f-template-name" label="药物模板名称" required>
          <input
            type="text"
            id="f-template-name"
            className={errors['templateName'] ? INPUT_ERROR_CLASS : INPUT_CLASS}
            value={value.templateName}
            onChange={(e) => onChange({ templateName: e.target.value })}
            placeholder="例如：模拟药物A / 院内 XX 注射液（已核实）"
          />
        </FieldRow>

        <FieldRow htmlFor="f-mode" label="计算模式" required>
          <select
            id="f-mode"
            className={INPUT_CLASS}
            value={value.calcMode}
            onChange={(e) => onChange({ calcMode: e.target.value as CalcFormState['calcMode'] })}
          >
            {MODE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FieldRow>

        <FieldRow htmlFor="f-times" label="每日给药次数" required error={errors['timesPerDay']}>
          <input
            id="f-times"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            className={errors['timesPerDay'] ? INPUT_ERROR_CLASS : INPUT_CLASS}
            value={value.timesPerDay}
            onChange={(e) => onChange({ timesPerDay: e.target.value })}
            placeholder="正整数，例如 3"
          />
        </FieldRow>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-slate-700">患者体格数据（本工具不保存身份信息）</h3>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <FieldRow htmlFor="f-age-years" label="年龄（年）" error={errors['ageYears']}>
            <input
              id="f-age-years"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              className={errors['ageYears'] ? INPUT_ERROR_CLASS : INPUT_CLASS}
              value={value.ageYears}
              onChange={(e) => onChange({ ageYears: e.target.value })}
              placeholder="选填"
            />
          </FieldRow>
          <FieldRow htmlFor="f-age-months" label="月龄（月）" error={errors['ageMonths']}>
            <input
              id="f-age-months"
              type="number"
              inputMode="numeric"
              min={0}
              max={11}
              step={1}
              className={errors['ageMonths'] ? INPUT_ERROR_CLASS : INPUT_CLASS}
              value={value.ageMonths}
              onChange={(e) => onChange({ ageMonths: e.target.value })}
              placeholder="选填"
            />
          </FieldRow>
          <div className="col-span-2 sm:col-span-2" />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          年龄仅用于记录与风险提示，不直接推断药物剂量。
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldRow
            htmlFor="f-weight"
            label="体重"
            required
            error={errors['weight']}
            hint={weightKgPreview(value.weight, value.weightUnit) ?? undefined}
          >
            <div className="flex gap-2">
              <input
                id="f-weight"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                className={`${errors['weight'] ? INPUT_ERROR_CLASS : INPUT_CLASS} flex-1`}
                value={value.weight}
                onChange={(e) => onChange({ weight: e.target.value })}
                placeholder="必填，大于 0"
              />
              <select
                className={UNIT_SELECT_CLASS}
                value={value.weightUnit}
                onChange={(e) =>
                  onChange({ weightUnit: e.target.value as WeightUnit })
                }
                aria-label="体重单位"
              >
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
            </div>
          </FieldRow>

          <FieldRow
            htmlFor="f-height"
            label="身高"
            required={basisIsBsa}
            error={errors['height']}
            hint={
              (basisIsBsa
                ? '体表面积模式下身高必填'
                : '体重模式下选填；仅用于记录') +
              (heightCmPreview(value.height, value.heightUnit)
                ? ` · ${heightCmPreview(value.height, value.heightUnit)}`
                : '')
            }
          >
            <div className="flex gap-2">
              <input
                id="f-height"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                className={`${errors['height'] ? INPUT_ERROR_CLASS : INPUT_CLASS} flex-1`}
                value={value.height}
                onChange={(e) => onChange({ height: e.target.value })}
                placeholder={basisIsBsa ? '必填，大于 0' : '选填'}
              />
              <select
                className={UNIT_SELECT_CLASS}
                value={value.heightUnit}
                onChange={(e) =>
                  onChange({ heightUnit: e.target.value as 'cm' | 'inch' })
                }
                aria-label="身高单位"
              >
                <option value="cm">cm</option>
                <option value="inch">inch</option>
              </select>
            </div>
          </FieldRow>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-slate-700">人工录入的剂量参数</h3>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldRow
            htmlFor="f-dose"
            label={DOSE_PARAM_LABELS[value.calcMode]}
            required
            error={errors['dosePerUnit']}
            hint="必须大于 0；需依据权威药品说明书或临床规范人工填写"
          >
            <input
              id="f-dose"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              className={errors['dosePerUnit'] ? INPUT_ERROR_CLASS : INPUT_CLASS}
              value={value.dosePerUnit}
              onChange={(e) => onChange({ dosePerUnit: e.target.value })}
              placeholder="必填，大于 0"
            />
          </FieldRow>

          <FieldRow
            htmlFor="f-concentration"
            label="制剂浓度（mg/mL）"
            error={errors['concentration']}
            hint="可选；填写后将换算每次液体体积"
          >
            <input
              id="f-concentration"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              className={errors['concentration'] ? INPUT_ERROR_CLASS : INPUT_CLASS}
              value={value.concentration}
              onChange={(e) => onChange({ concentration: e.target.value })}
              placeholder="选填，例如 20"
            />
          </FieldRow>

          <FieldRow
            htmlFor="f-max-single"
            label="单次最大剂量（mg/次）"
            error={errors['maxSingleDose']}
            hint="可选；超限时高亮预警，不自动修正"
          >
            <input
              id="f-max-single"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              className={errors['maxSingleDose'] ? INPUT_ERROR_CLASS : INPUT_CLASS}
              value={value.maxSingleDose}
              onChange={(e) => onChange({ maxSingleDose: e.target.value })}
              placeholder="选填"
            />
          </FieldRow>

          <FieldRow
            htmlFor="f-max-daily"
            label="每日最大剂量（mg/日）"
            error={errors['maxDailyDose']}
            hint="可选；超限时高亮预警，不自动修正"
          >
            <input
              id="f-max-daily"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              className={errors['maxDailyDose'] ? INPUT_ERROR_CLASS : INPUT_CLASS}
              value={value.maxDailyDose}
              onChange={(e) => onChange({ maxDailyDose: e.target.value })}
              placeholder="选填"
            />
          </FieldRow>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-slate-700">数据来源与审核状态</h3>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldRow
            htmlFor="f-source"
            label="数据来源"
            error={errors['source']}
            hint="未填写来源时，结果中将显示「剂量参数来源未填写」警告"
          >
            <input
              id="f-source"
              type="text"
              className={INPUT_CLASS}
              value={value.source}
              onChange={(e) => onChange({ source: e.target.value })}
              placeholder="权威药品说明书 / 临床指南名称"
            />
          </FieldRow>
          <FieldRow htmlFor="f-source-version" label="来源版本或发布日期">
            <input
              id="f-source-version"
              type="text"
              className={INPUT_CLASS}
              value={value.sourceVersion}
              onChange={(e) => onChange({ sourceVersion: e.target.value })}
              placeholder="例如 2023 版 / 2026-01 发布"
            />
          </FieldRow>
          <FieldRow htmlFor="f-review-status" label="审核状态">
            <select
              id="f-review-status"
              className={INPUT_CLASS}
              value={value.reviewStatus}
              onChange={(e) =>
                onChange({
                  reviewStatus: e.target.value as CalcFormState['reviewStatus'],
                })
              }
            >
              <option value="未审核">未审核</option>
              <option value="已审核">已审核</option>
            </select>
          </FieldRow>
          <FieldRow htmlFor="f-notes" label="备注">
            <input
              id="f-notes"
              type="text"
              className={INPUT_CLASS}
              value={value.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
              placeholder="选填，例如配伍、年龄限制等注意事项"
            />
          </FieldRow>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={requiredMissing}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 text-base font-bold text-white shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            requiredMissing
              ? 'cursor-not-allowed bg-slate-300'
              : 'bg-teal-600 hover:bg-teal-700 focus-visible:ring-teal-500 active:scale-[0.99]'
          }`}
          aria-label={hasResult ? '重新计算' : '开始计算'}
        >
          {hasResult ? '重新计算' : '开始计算'}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <IconReset className="h-4 w-4" />
          重置
        </button>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {requiredMissing
          ? '请先填写必填项（体重、剂量参数、每日次数；体表面积模式还需身高），计算按钮将变为可用。'
          : '计算仅在本浏览器内完成，结果仅用于教学演示与剂量复核。'}
      </p>
    </form>
  );
}

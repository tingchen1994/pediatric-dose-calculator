import { useState } from 'react';
import type { CalcMode, DrugTemplate, ReviewStatus } from '../types';
import { MODE_OPTIONS, doseParamUnit } from '../utils/calc';
import { isPositiveFinite, isPositiveInteger, parseNumber } from '../utils/validation';

interface TemplateEditorProps {
  open: boolean;
  template: DrugTemplate | null; // null = 新建
  onSave: (template: DrugTemplate) => void;
  onCancel: () => void;
}

interface EditorErrors {
  name?: string;
  dosePerUnit?: string;
  timesPerDay?: string;
  maxSingleDose?: string;
  maxDailyDose?: string;
  concentration?: string;
}

const INPUT_CLASS =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500';
const INPUT_ERROR_CLASS =
  'w-full rounded-lg border border-red-400 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500';

/**
 * 模板编辑器（新建 / 编辑用户自定义模板）。
 *
 * 安全设计：
 * - 所有剂量参数必须人工录入并校验；
 * - 保存时强制提醒填写数据来源与审核状态；
 * - 内置模板不可编辑，编辑器仅处理用户自定义模板。
 */
export function TemplateEditor({
  open,
  template,
  onSave,
  onCancel,
}: TemplateEditorProps) {
  const [name, setName] = useState(template?.name ?? '');
  const [calcMode, setCalcMode] = useState<CalcMode>(
    template?.calcMode ?? 'weight-per-dose',
  );
  const [dosePerUnit, setDosePerUnit] = useState(
    template?.dosePerUnit === null ? '' : String(template?.dosePerUnit ?? ''),
  );
  const [timesPerDay, setTimesPerDay] = useState(
    template?.timesPerDay === null ? '' : String(template?.timesPerDay ?? ''),
  );
  const [maxSingleDose, setMaxSingleDose] = useState(
    template?.maxSingleDose === null ? '' : String(template?.maxSingleDose ?? ''),
  );
  const [maxDailyDose, setMaxDailyDose] = useState(
    template?.maxDailyDose === null ? '' : String(template?.maxDailyDose ?? ''),
  );
  const [concentration, setConcentration] = useState(
    template?.concentration === null ? '' : String(template?.concentration ?? ''),
  );
  const [source, setSource] = useState(template?.source ?? '');
  const [sourceVersion, setSourceVersion] = useState(
    template?.sourceVersion ?? '',
  );
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>(
    template?.reviewStatus ?? '未审核',
  );
  const [notes, setNotes] = useState(template?.notes ?? '');
  const [errors, setErrors] = useState<EditorErrors>({});

  if (!open) return null;

  const validate = (): EditorErrors => {
    const e: EditorErrors = {};
    if (!name.trim()) e.name = '请填写模板名称。';
    const d = parseNumber(dosePerUnit);
    if (d === null) e.dosePerUnit = '请填写剂量参数（必填）。';
    else if (!isPositiveFinite(d)) e.dosePerUnit = '剂量参数必须大于 0。';
    const t = parseNumber(timesPerDay);
    if (t === null) e.timesPerDay = '请填写每日给药次数。';
    else if (!isPositiveInteger(t))
      e.timesPerDay = '每日给药次数必须是正整数（≥1）。';
    const ms = parseNumber(maxSingleDose);
    if (ms !== null && !isPositiveFinite(ms))
      e.maxSingleDose = '填写时必须大于 0。';
    const md = parseNumber(maxDailyDose);
    if (md !== null && !isPositiveFinite(md)) e.maxDailyDose = '填写时必须大于 0。';
    const c = parseNumber(concentration);
    if (c !== null && !isPositiveFinite(c)) e.concentration = '填写时必须大于 0。';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const now = new Date().toISOString();
    const saved: DrugTemplate = {
      id: template?.id ?? `user-${now}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      builtin: false,
      // 用户自行录入的模板不标记为「虚构演示数据」，由使用者自行对其真实性负责
      fictional: false,
      calcMode,
      dosePerUnit: parseNumber(dosePerUnit),
      timesPerDay: parseNumber(timesPerDay),
      maxSingleDose: parseNumber(maxSingleDose),
      maxDailyDose: parseNumber(maxDailyDose),
      concentration: parseNumber(concentration),
      source: source.trim(),
      sourceVersion: sourceVersion.trim(),
      reviewStatus,
      notes: notes.trim(),
      createdAt: template?.createdAt ?? now,
      updatedAt: now,
    };
    onSave(saved);
  };

  const fieldClass = (error?: string) =>
    error ? INPUT_ERROR_CLASS : INPUT_CLASS;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-editor-title"
    >
      <div
        className="absolute inset-0 bg-slate-900/40"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="relative my-8 w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
        <h3
          id="template-editor-title"
          className="text-lg font-bold text-slate-900"
        >
          {template ? '编辑自定义模板' : '新增自定义模板'}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-amber-700">
          安全提示：真实药物数据只能由管理员依据最新权威药品说明书或临床规范人工录入，
          并填写来源、版本/发布日期与审核状态。请勿录入未经核实的剂量。
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              模板名称 <span className="text-red-500">*</span>
            </label>
            <input
              id="te-name"
              type="text"
              className={fieldClass(errors.name)}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：XX 注射液（依据 XX 说明书 2025 版）"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              计算模式
            </label>
            <select
              id="te-mode"
              className={INPUT_CLASS}
              value={calcMode}
              onChange={(e) => setCalcMode(e.target.value as CalcMode)}
            >
              {MODE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              每日给药次数 <span className="text-red-500">*</span>
            </label>
            <input
              id="te-times"
              type="number"
              min={1}
              step={1}
              className={fieldClass(errors.timesPerDay)}
              value={timesPerDay}
              onChange={(e) => setTimesPerDay(e.target.value)}
              placeholder="正整数"
            />
            {errors.timesPerDay && (
              <p className="mt-1 text-xs text-red-600">{errors.timesPerDay}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              剂量参数（{doseParamUnit(calcMode)}）{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              id="te-dose"
              type="number"
              min={0}
              step="any"
              className={fieldClass(errors.dosePerUnit)}
              value={dosePerUnit}
              onChange={(e) => setDosePerUnit(e.target.value)}
              placeholder="大于 0"
            />
            {errors.dosePerUnit && (
              <p className="mt-1 text-xs text-red-600">{errors.dosePerUnit}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              制剂浓度（mg/mL，可选）
            </label>
            <input
              id="te-conc"
              type="number"
              min={0}
              step="any"
              className={fieldClass(errors.concentration)}
              value={concentration}
              onChange={(e) => setConcentration(e.target.value)}
              placeholder="选填"
            />
            {errors.concentration && (
              <p className="mt-1 text-xs text-red-600">
                {errors.concentration}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              单次最大剂量（mg/次，可选）
            </label>
            <input
              id="te-max-single"
              type="number"
              min={0}
              step="any"
              className={fieldClass(errors.maxSingleDose)}
              value={maxSingleDose}
              onChange={(e) => setMaxSingleDose(e.target.value)}
              placeholder="选填"
            />
            {errors.maxSingleDose && (
              <p className="mt-1 text-xs text-red-600">
                {errors.maxSingleDose}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              每日最大剂量（mg/日，可选）
            </label>
            <input
              id="te-max-daily"
              type="number"
              min={0}
              step="any"
              className={fieldClass(errors.maxDailyDose)}
              value={maxDailyDose}
              onChange={(e) => setMaxDailyDose(e.target.value)}
              placeholder="选填"
            />
            {errors.maxDailyDose && (
              <p className="mt-1 text-xs text-red-600">
                {errors.maxDailyDose}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              数据来源 <span className="text-red-500">*</span>
              <span className="ml-1 text-xs font-normal text-slate-500">
                （未填写来源的模板在计算结果中会显示警告）
              </span>
            </label>
            <input
              id="te-source"
              type="text"
              className={INPUT_CLASS}
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="例如：XX 药品说明书（2025 版）/ XX 临床指南"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              来源版本或发布日期
            </label>
            <input
              id="te-source-version"
              type="text"
              className={INPUT_CLASS}
              value={sourceVersion}
              onChange={(e) => setSourceVersion(e.target.value)}
              placeholder="例如 2025 版 / 2026-01 发布"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              审核状态
            </label>
            <select
              id="te-review-status"
              className={INPUT_CLASS}
              value={reviewStatus}
              onChange={(e) => setReviewStatus(e.target.value as ReviewStatus)}
            >
              <option value="未审核">未审核</option>
              <option value="已审核">已审核</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              备注
            </label>
            <textarea
              id="te-notes"
              className={INPUT_CLASS}
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="选填，例如配伍、年龄限制、特殊用法等注意事项"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
          >
            保存模板
          </button>
        </div>
      </div>
    </div>
  );
}

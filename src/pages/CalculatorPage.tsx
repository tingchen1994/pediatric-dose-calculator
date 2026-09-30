import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type {
  CalcFormState,
  ComputedResult,
  ComputeInput,
  DrugTemplate,
  HistoryEntry,
} from '../types';
import { CalculatorForm } from '../components/CalculatorForm';
import { ResultCard } from '../components/ResultCard';
import { computeDoseResult } from '../utils/calc';
import { copyText } from '../utils/clipboard';
import { buildResultText } from '../utils/resultText';
import {
  loadAllTemplates,
  loadHistory,
  makeId,
  saveHistory,
} from '../utils/storage';
import { createEmptyFormState, templateToFormState } from '../utils/template';
import {
  validateComputeInput,
  parseNumber,
  type FieldErrors,
} from '../utils/validation';

interface LocationState {
  templateId?: string;
}

function buildComputeInput(form: CalcFormState): ComputeInput {
  const height = parseNumber(form.height);
  return {
    ageYears: parseNumber(form.ageYears),
    ageMonths: parseNumber(form.ageMonths),
    weightInput: parseNumber(form.weight) as number,
    weightUnit: form.weightUnit,
    heightInput: height,
    heightUnit: form.heightUnit,
    calcMode: form.calcMode,
    dosePerUnit: parseNumber(form.dosePerUnit) as number,
    timesPerDay: parseNumber(form.timesPerDay) as number,
    maxSingleDose: parseNumber(form.maxSingleDose),
    maxDailyDose: parseNumber(form.maxDailyDose),
    concentration: parseNumber(form.concentration),
    templateName: form.templateName.trim() || '未命名模板',
    fictional: form.fictional,
    source: form.source.trim(),
    sourceVersion: form.sourceVersion.trim(),
    reviewStatus: form.reviewStatus,
    notes: form.notes.trim(),
  };
}

export function CalculatorPage() {
  const location = useLocation();
  const [templates] = useState<DrugTemplate[]>(() => loadAllTemplates());
  const [form, setForm] = useState<CalcFormState>(() => createEmptyFormState());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [result, setResult] = useState<ComputedResult | null>(null);
  const [computedAt, setComputedAt] = useState<string>('');
  const resultRef = useRef<HTMLDivElement>(null);

  // 从「药物模板」页跳转时自动应用指定模板
  useEffect(() => {
    const state = location.state as LocationState | null;
    if (state?.templateId) {
      const t = templates.find((x) => x.id === state.templateId);
      if (t) {
        setForm(templateToFormState(t));
        setResult(null);
        setErrors({});
      }
    }
  }, [location.state, templates]);

  const handleChange = (patch: Partial<CalcFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleTemplateChange = (templateId: string) => {
    const t = templates.find((x) => x.id === templateId);
    if (t) {
      setForm(templateToFormState(t));
      setErrors({});
    }
  };

  const handleCompute = () => {
    const { errors: fieldErrors, inputWarnings } = validateComputeInput({
      ageYears: form.ageYears,
      ageMonths: form.ageMonths,
      weight: form.weight,
      weightUnit: form.weightUnit,
      height: form.height,
      heightUnit: form.heightUnit,
      calcMode: form.calcMode,
      dosePerUnit: form.dosePerUnit,
      timesPerDay: form.timesPerDay,
      maxSingleDose: form.maxSingleDose,
      maxDailyDose: form.maxDailyDose,
      concentration: form.concentration,
    });

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      setResult(null);
      return;
    }

    setErrors({});
    const input = buildComputeInput(form);
    const computed = computeDoseResult(input, inputWarnings);
    const now = new Date().toISOString();
    setResult(computed);
    setComputedAt(now);

    // 保存到历史（仅本地浏览器，不含个人信息）
    const entry: HistoryEntry = { ...computed, id: makeId(), createdAt: now };
    saveHistory([entry, ...loadHistory()]);
  };

  const handleReset = () => {
    setForm(createEmptyFormState());
    setErrors({});
    setResult(null);
    setComputedAt('');
  };

  const handleCopy = async () => {
    if (!result) return;
    await copyText(buildResultText(result, computedAt));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
      <div>
        <CalculatorForm
          value={form}
          errors={errors}
          templates={templates}
          hasResult={result !== null}
          onChange={handleChange}
          onTemplateChange={handleTemplateChange}
          onSubmit={handleCompute}
          onReset={handleReset}
        />
      </div>
      <div ref={resultRef} className="lg:sticky lg:top-20">
        {result ? (
          <ResultCard
            result={result}
            computedAt={computedAt}
            onCopy={handleCopy}
            onPrint={handlePrint}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-600">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path d="M9 3h6M10 3v6.5L5.2 18a2 2 0 0 0 1.8 3h10a2 2 0 0 0 1.8-3L14 9.5V3" />
                <line x1="7" y1="15" x2="17" y2="15" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-600">
              填写左侧表单后点击「开始计算」
            </p>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
              计算结果将显示在这里：输入换算、BSA、数学计算结果、上限比较、
              完整计算过程与安全声明。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

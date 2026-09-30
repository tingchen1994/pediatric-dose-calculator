/**
 * 剂量计算核心模块（纯函数，不依赖浏览器环境，便于单元测试）。
 *
 * 安全设计：
 * - 本模块只做「数学计算」，不做任何医学判断；
 * - 不自动修正（截断）超限结果，超限判定仅输出标识与差值，由界面高亮预警；
 * - 全部中间值保留原始精度，仅在展示层舍入。
 */

import type {
  Basis,
  CalcMode,
  CalcStep,
  ComputedResult,
  ComputeInput,
} from '../types';
import { formatNumber } from './format';

/** lb → kg 换算系数 */
export const LB_TO_KG = 0.45359237;
/** inch → cm 换算系数 */
export const INCH_TO_CM = 2.54;
/** Mosteller 体表面积公式除数 */
export const BSA_DIVISOR = 3600;

export function lbToKg(lb: number): number {
  return lb * LB_TO_KG;
}

export function kgToLb(kg: number): number {
  return kg / LB_TO_KG;
}

export function inchToCm(inch: number): number {
  return inch * INCH_TO_CM;
}

export function cmToInch(cm: number): number {
  return cm / INCH_TO_CM;
}

/**
 * Mosteller 体表面积公式：
 * BSA（m²）= √[(身高cm × 体重kg) ÷ 3600]
 */
export function mostellerBSA(heightCm: number, weightKg: number): number {
  return Math.sqrt((heightCm * weightKg) / BSA_DIVISOR);
}

/** 计算模式所依据的体格指标 */
export function modeBasis(mode: CalcMode): Basis {
  return mode === 'bsa-per-dose' || mode === 'bsa-per-day' ? 'bsa' : 'weight';
}

/** 计算模式是否为「每日剂量」型（mg/kg/日、mg/m²/日） */
export function modeIsPerDay(mode: CalcMode): boolean {
  return mode === 'weight-per-day' || mode === 'bsa-per-day';
}

export const MODE_LABELS: Record<CalcMode, string> = {
  'weight-per-dose': '按体重：mg/kg/次',
  'weight-per-day': '按体重：mg/kg/日',
  'bsa-per-dose': '按体表面积：mg/m²/次',
  'bsa-per-day': '按体表面积：mg/m²/日',
};

export const MODE_OPTIONS: { value: CalcMode; label: string }[] = [
  { value: 'weight-per-dose', label: MODE_LABELS['weight-per-dose'] },
  { value: 'weight-per-day', label: MODE_LABELS['weight-per-day'] },
  { value: 'bsa-per-dose', label: MODE_LABELS['bsa-per-dose'] },
  { value: 'bsa-per-day', label: MODE_LABELS['bsa-per-day'] },
];

/** 剂量参数输入框标签（依据计算模式变化，保证单位与标签一致） */
export const DOSE_PARAM_LABELS: Record<CalcMode, string> = {
  'weight-per-dose': '每kg每次剂量（mg/kg/次）',
  'weight-per-day': '每kg每日剂量（mg/kg/日）',
  'bsa-per-dose': '每m²每次剂量（mg/m²/次）',
  'bsa-per-day': '每m²每日剂量（mg/m²/日）',
};

/** 根据计算模式得到剂量参数的单位文本 */
export function doseParamUnit(mode: CalcMode): string {
  switch (mode) {
    case 'weight-per-dose':
      return 'mg/kg/次';
    case 'weight-per-day':
      return 'mg/kg/日';
    case 'bsa-per-dose':
      return 'mg/m²/次';
    case 'bsa-per-day':
      return 'mg/m²/日';
  }
}

export interface DoseCalcParams {
  basis: Basis;
  /** 体重（kg）或体表面积（m²，未提前舍入） */
  basisValue: number;
  dosePerUnit: number;
  /** true：dosePerUnit 为每日剂量；false：为单次剂量 */
  perDayBasis: boolean;
  timesPerDay: number;
}

export interface DoseCalcResult {
  singleDose: number;
  dailyDose: number;
}

/**
 * 剂量换算核心：
 * - 单次型：单次剂量 = 基准值 × 每次剂量；每日总量 = 单次剂量 × 每日次数；
 * - 每日型：每日总量 = 基准值 × 每日剂量；单次剂量 = 每日总量 ÷ 每日次数。
 */
export function calculateDose(p: DoseCalcParams): DoseCalcResult {
  if (p.perDayBasis) {
    const dailyDose = p.basisValue * p.dosePerUnit;
    return { dailyDose, singleDose: dailyDose / p.timesPerDay };
  }
  const singleDose = p.basisValue * p.dosePerUnit;
  return { singleDose, dailyDose: singleDose * p.timesPerDay };
}

/** 液体制剂体积换算：每次体积（mL/次）= 单次剂量（mg/次）÷ 浓度（mg/mL） */
export function computeVolumeMl(
  singleDoseMg: number,
  concentration: number,
): number {
  return singleDoseMg / concentration;
}

export interface MaxComparison {
  exceeded: boolean;
  /** 超出上限的差值（未超限或未设置上限时为 null） */
  diff: number | null;
}

/** 与人工录入的上限比较（不自动修正结果，仅返回标识与差值） */
export function compareWithMax(
  value: number,
  max: number | null,
): MaxComparison {
  if (max === null || max === undefined) {
    return { exceeded: false, diff: null };
  }
  if (value > max) {
    return { exceeded: true, diff: value - max };
  }
  return { exceeded: false, diff: null };
}

/**
 * 完整计算流水线：单位换算 → BSA（如需）→ 剂量换算 → 液体体积 → 上限比较。
 *
 * 调用前必须已通过 validateComputeInput 校验：
 * - 体重、剂量参数、每日次数必填且大于 0（次数为正整数）；
 * - 体表面积模式下身高必填。
 */
export function computeDoseResult(
  input: ComputeInput,
  inputWarnings: string[] = [],
): ComputedResult {
  const steps: CalcStep[] = [];

  // 1. 体重单位换算（内部统一为 kg）
  const weightKg =
    input.weightUnit === 'lb' ? lbToKg(input.weightInput) : input.weightInput;
  if (input.weightUnit === 'lb') {
    steps.push({
      label: '体重单位换算',
      expression: `体重（kg）= ${formatNumber(input.weightInput, 4)} lb × ${LB_TO_KG} = ${formatNumber(weightKg, 4)} kg`,
      value: weightKg,
      unit: 'kg',
    });
  }

  // 2. 身高单位换算（内部统一为 cm）
  let heightCm: number | null = null;
  if (input.heightInput !== null) {
    heightCm =
      input.heightUnit === 'inch'
        ? inchToCm(input.heightInput)
        : input.heightInput;
    if (input.heightUnit === 'inch') {
      steps.push({
        label: '身高单位换算',
        expression: `身高（cm）= ${formatNumber(input.heightInput, 4)} inch × ${INCH_TO_CM} = ${formatNumber(heightCm, 4)} cm`,
        value: heightCm,
        unit: 'cm',
      });
    }
  }

  // 3. 体表面积（Mosteller，使用未舍入的原始值参与后续计算）
  let bsa: number | null = null;
  const basis = modeBasis(input.calcMode);
  if (basis === 'bsa') {
    const h = heightCm as number; // 校验保证体表面积模式下身高已填写
    const w = weightKg;
    bsa = mostellerBSA(h, w);
    steps.push({
      label: '体表面积（Mosteller 公式）',
      expression: `BSA（m²）= √[(身高cm × 体重kg) ÷ 3600] = √[(${formatNumber(h, 1)} × ${formatNumber(w, 2)}) ÷ 3600] = √${formatNumber((h * w) / BSA_DIVISOR, 6)}`,
      value: bsa,
      unit: 'm²',
    });
  }

  // 4. 剂量换算
  const basisValue = basis === 'weight' ? weightKg : (bsa as number);
  const basisName = basis === 'weight' ? '体重' : '体表面积';
  const basisUnit = basis === 'weight' ? 'kg' : 'm²';
  const dose = calculateDose({
    basis,
    basisValue,
    dosePerUnit: input.dosePerUnit,
    perDayBasis: modeIsPerDay(input.calcMode),
    timesPerDay: input.timesPerDay,
  });

  if (modeIsPerDay(input.calcMode)) {
    steps.push({
      label: '每日数学计算总量',
      expression: `每日总量（mg/日）= ${basisName}（${basisUnit}） × 每${basisUnit === 'kg' ? 'kg' : 'm²'}每日剂量（mg/${basisUnit}/日） = ${formatNumber(basisValue, 4)} × ${formatNumber(input.dosePerUnit, 4)} = ${formatNumber(dose.dailyDose, 4)}`,
      value: dose.dailyDose,
      unit: 'mg/日',
    });
    steps.push({
      label: '单次数学计算剂量（由每日总量均分）',
      expression: `单次剂量（mg/次）= 每日总量 ÷ 每日次数 = ${formatNumber(dose.dailyDose, 4)} ÷ ${input.timesPerDay} = ${formatNumber(dose.singleDose, 4)}`,
      value: dose.singleDose,
      unit: 'mg/次',
    });
  } else {
    steps.push({
      label: '单次数学计算剂量',
      expression: `单次剂量（mg/次）= ${basisName}（${basisUnit}） × 每${basisUnit === 'kg' ? 'kg' : 'm²'}每次剂量（mg/${basisUnit}/次） = ${formatNumber(basisValue, 4)} × ${formatNumber(input.dosePerUnit, 4)} = ${formatNumber(dose.singleDose, 4)}`,
      value: dose.singleDose,
      unit: 'mg/次',
    });
    steps.push({
      label: '每日数学计算总量',
      expression: `每日总量（mg/日）= 单次剂量 × 每日次数 = ${formatNumber(dose.singleDose, 4)} × ${input.timesPerDay} = ${formatNumber(dose.dailyDose, 4)}`,
      value: dose.dailyDose,
      unit: 'mg/日',
    });
  }

  // 5. 液体制剂体积换算（不四舍五入到量具刻度）
  let volumePerDose: number | null = null;
  if (input.concentration !== null && input.concentration > 0) {
    volumePerDose = computeVolumeMl(dose.singleDose, input.concentration);
    steps.push({
      label: '液体制剂体积换算',
      expression: `每次体积（mL/次）= 单次剂量（mg/次）÷ 制剂浓度（mg/mL） = ${formatNumber(dose.singleDose, 4)} ÷ ${formatNumber(input.concentration, 4)} = ${formatNumber(volumePerDose, 4)}`,
      value: volumePerDose,
      unit: 'mL/次',
    });
  }

  // 6. 与人工录入的上限比较（不自动修正，仅记录差值）
  const singleCheck = compareWithMax(dose.singleDose, input.maxSingleDose);
  const dailyCheck = compareWithMax(dose.dailyDose, input.maxDailyDose);
  if (input.maxSingleDose !== null) {
    steps.push({
      label: '单次最大剂量比较',
      expression: singleCheck.exceeded
        ? `数学计算结果 ${formatNumber(dose.singleDose, 4)} mg/次 > 人工录入上限 ${formatNumber(input.maxSingleDose, 4)} mg/次，超出 ${formatNumber(singleCheck.diff as number, 4)} mg/次（不自动修正，需专业复核）`
        : `数学计算结果 ${formatNumber(dose.singleDose, 4)} mg/次 ≤ 人工录入上限 ${formatNumber(input.maxSingleDose, 4)} mg/次`,
      value: singleCheck.diff,
      unit: 'mg/次',
    });
  }
  if (input.maxDailyDose !== null) {
    steps.push({
      label: '每日最大剂量比较',
      expression: dailyCheck.exceeded
        ? `数学计算结果 ${formatNumber(dose.dailyDose, 4)} mg/日 > 人工录入上限 ${formatNumber(input.maxDailyDose, 4)} mg/日，超出 ${formatNumber(dailyCheck.diff as number, 4)} mg/日（不自动修正，需专业复核）`
        : `数学计算结果 ${formatNumber(dose.dailyDose, 4)} mg/日 ≤ 人工录入上限 ${formatNumber(input.maxDailyDose, 4)} mg/日`,
      value: dailyCheck.diff,
      unit: 'mg/日',
    });
  }

  return {
    calcMode: input.calcMode,
    ageYears: input.ageYears,
    ageMonths: input.ageMonths,
    weightInput: input.weightInput,
    weightUnit: input.weightUnit,
    weightKg,
    heightInput: input.heightInput,
    heightUnit: input.heightUnit,
    heightCm,
    bsa,
    dosePerUnit: input.dosePerUnit,
    timesPerDay: input.timesPerDay,
    maxSingleDose: input.maxSingleDose,
    maxDailyDose: input.maxDailyDose,
    concentration: input.concentration,
    templateName: input.templateName,
    fictional: input.fictional,
    source: input.source,
    sourceVersion: input.sourceVersion,
    reviewStatus: input.reviewStatus,
    notes: input.notes,
    singleDose: dose.singleDose,
    dailyDose: dose.dailyDose,
    volumePerDose,
    singleExceeded: singleCheck.exceeded,
    dailyExceeded: dailyCheck.exceeded,
    singleExceedDiff: singleCheck.diff,
    dailyExceedDiff: dailyCheck.diff,
    inputWarnings,
    steps,
  };
}

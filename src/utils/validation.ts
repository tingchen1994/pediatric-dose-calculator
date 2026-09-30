/**
 * 输入校验模块（纯函数）。
 *
 * 原则：
 * - 所有数值必须为有限数字（拒绝 NaN、Infinity）；
 * - 体重、身高、剂量参数、浓度必须大于 0，不允许负数与空值参与计算；
 * - 每日给药次数必须是正整数；
 * - 身高缺失时禁止进行 BSA 计算；每日次数缺失时禁止计算单次剂量；
 * - 异常大/异常小的输入只作「输入核对提醒」，不作为医学判断。
 */

import type { CalcMode, HeightUnit, WeightUnit } from '../types';
import { inchToCm, lbToKg, modeBasis } from './calc';
import { formatNumber } from './format';

/** 解析字符串/数字为有限数字，无法解析时返回 null */
export function parseNumber(
  raw: string | number | null | undefined,
): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : null;
  }
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function isPositiveFinite(n: number): boolean {
  return Number.isFinite(n) && n > 0;
}

export function isPositiveInteger(n: number): boolean {
  return Number.isFinite(n) && Number.isInteger(n) && n > 0;
}

export interface CalcRawInput {
  ageYears: string | number | null;
  ageMonths: string | number | null;
  weight: string | number | null;
  weightUnit: WeightUnit;
  height: string | number | null;
  heightUnit: HeightUnit;
  calcMode: CalcMode;
  dosePerUnit: string | number | null;
  timesPerDay: string | number | null;
  maxSingleDose: string | number | null;
  maxDailyDose: string | number | null;
  concentration: string | number | null;
}

export type FieldErrors = Record<string, string>;

export interface ValidationResult {
  /** 字段级错误（阻断计算） */
  errors: FieldErrors;
  /** 输入核对提醒（不阻断计算，不作为医学判断） */
  inputWarnings: string[];
}

/** 体重核对提醒区间（kg），仅用于提示录入值是否明显异常 */
const WEIGHT_HINT_RANGE_KG: [number, number] = [0.5, 150];
/** 身高核对提醒区间（cm），仅用于提示录入值是否明显异常 */
const HEIGHT_HINT_RANGE_CM: [number, number] = [30, 200];

export function validateComputeInput(raw: CalcRawInput): ValidationResult {
  const errors: FieldErrors = {};
  const inputWarnings: string[] = [];

  // 年龄：只用于记录与风险提示，不参与剂量计算
  const ageY = parseNumber(raw.ageYears);
  if (ageY !== null && ageY < 0) {
    errors['ageYears'] = '年龄不能为负数，请核对。';
  }
  const ageM = parseNumber(raw.ageMonths);
  if (ageM !== null && ageM < 0) {
    errors['ageMonths'] = '月龄不能为负数，请核对。';
  }
  if (ageY !== null && ageM !== null && ageY > 0 && ageM >= 12) {
    inputWarnings.push(
      '月龄填写 ≥ 12 个月时建议合并计入年龄（年），请核对录入值。',
    );
  }

  // 体重：必填、有限、大于 0；换算为 kg 后核对提醒
  const w = parseNumber(raw.weight);
  if (w === null) {
    errors['weight'] = '请输入体重（必填，必须大于 0）。';
  } else if (!isPositiveFinite(w)) {
    errors['weight'] = '体重必须为大于 0 的有限数字（不能为 NaN、Infinity、0 或负数）。';
  } else {
    const kg = raw.weightUnit === 'lb' ? lbToKg(w) : w;
    if (kg < WEIGHT_HINT_RANGE_KG[0] || kg > WEIGHT_HINT_RANGE_KG[1]) {
      inputWarnings.push(
        `体重 ${formatNumber(w, 2)} ${raw.weightUnit}（换算为 ${formatNumber(kg, 2)} kg）明显偏离常见儿童范围，请核对录入值和单位。`,
      );
    }
  }

  // 身高：体表面积模式下必填；填写时必须大于 0
  const h = parseNumber(raw.height);
  const needHeight = modeBasis(raw.calcMode) === 'bsa';
  if (h === null) {
    if (needHeight) {
      errors['height'] = '体表面积模式下身高为必填项，且必须大于 0。';
    }
  } else if (!isPositiveFinite(h)) {
    errors['height'] = '身高必须为大于 0 的有限数字（不能为 NaN、Infinity、0 或负数）。';
  } else {
    const cm = raw.heightUnit === 'inch' ? inchToCm(h) : h;
    if (cm < HEIGHT_HINT_RANGE_CM[0] || cm > HEIGHT_HINT_RANGE_CM[1]) {
      inputWarnings.push(
        `身高 ${formatNumber(h, 2)} ${raw.heightUnit}（换算为 ${formatNumber(cm, 2)} cm）明显偏离常见儿童范围，请核对录入值和单位。`,
      );
    }
  }

  // 剂量参数：必填、大于 0
  const d = parseNumber(raw.dosePerUnit);
  if (d === null) {
    errors['dosePerUnit'] = '请填写剂量参数（必填，必须大于 0）。';
  } else if (!isPositiveFinite(d)) {
    errors['dosePerUnit'] = '剂量参数必须为大于 0 的有限数字。';
  }

  // 每日次数：必填、正整数（缺失时禁止计算单次剂量）
  const t = parseNumber(raw.timesPerDay);
  if (t === null) {
    errors['timesPerDay'] = '请填写每日给药次数（必填）。';
  } else if (!isPositiveInteger(t)) {
    errors['timesPerDay'] = '每日给药次数必须是正整数（≥1），用于换算单次/每日剂量。';
  }

  // 可选上限与浓度：填写时必须大于 0
  const ms = parseNumber(raw.maxSingleDose);
  if (ms !== null && !isPositiveFinite(ms)) {
    errors['maxSingleDose'] = '单次最大剂量为可选项，填写时必须为大于 0 的有限数字。';
  }
  const md = parseNumber(raw.maxDailyDose);
  if (md !== null && !isPositiveFinite(md)) {
    errors['maxDailyDose'] = '每日最大剂量为可选项，填写时必须为大于 0 的有限数字。';
  }
  const c = parseNumber(raw.concentration);
  if (c !== null && !isPositiveFinite(c)) {
    errors['concentration'] = '制剂浓度为可选项，填写时必须为大于 0 的有限数字（mg/mL）。';
  }

  return { errors, inputWarnings };
}

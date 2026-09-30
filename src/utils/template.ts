/**
 * 模板 <-> 表单状态转换工具。
 *
 * 注意：模板仅用于「自动填充」人工录入的参数；
 * 本项目不存在根据药物名称自动生成剂量的逻辑。
 */

import type { CalcFormState, DrugTemplate } from '../types';

/** 空白表单（用户自行录入已核实的参数） */
export function createEmptyFormState(): CalcFormState {
  return {
    templateId: 'blank',
    templateName: '空白模板（自行录入已核实参数）',
    fictional: false,
    calcMode: 'weight-per-dose',
    ageYears: '',
    ageMonths: '',
    weight: '',
    weightUnit: 'kg',
    height: '',
    heightUnit: 'cm',
    dosePerUnit: '',
    timesPerDay: '',
    maxSingleDose: '',
    maxDailyDose: '',
    concentration: '',
    source: '',
    sourceVersion: '',
    reviewStatus: '未审核',
    notes: '',
  };
}

function numToStr(n: number | null): string {
  return n === null ? '' : String(n);
}

/** 将模板参数填充到表单（年龄、体重、身高等测量值保持空白） */
export function templateToFormState(t: DrugTemplate): CalcFormState {
  const base = createEmptyFormState();
  return {
    ...base,
    templateId: t.id,
    templateName: t.name,
    fictional: t.fictional,
    calcMode: t.calcMode,
    dosePerUnit: numToStr(t.dosePerUnit),
    timesPerDay: numToStr(t.timesPerDay),
    maxSingleDose: numToStr(t.maxSingleDose),
    maxDailyDose: numToStr(t.maxDailyDose),
    concentration: numToStr(t.concentration),
    source: t.source,
    sourceVersion: t.sourceVersion,
    reviewStatus: t.reviewStatus,
    notes: t.notes,
  };
}

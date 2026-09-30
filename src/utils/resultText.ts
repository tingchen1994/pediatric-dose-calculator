/**
 * 计算结果纯文本生成（用于「复制结果」与历史记录复制）。
 *
 * 复制内容必须包含：完整计算过程、数据来源、安全声明。
 */

import type { ComputedResult } from '../types';
import { MODE_LABELS, doseParamUnit } from './calc';
import { formatAge, formatDateTime, formatNumber, formatRawValue } from './format';
import {
  DAILY_MAX_WARNING,
  FICTIONAL_NOTE,
  SAFETY_DISCLAIMER,
  SINGLE_MAX_WARNING,
  SOURCE_MISSING_WARNING,
  UNREVIEWED_WARNING,
  VOLUME_NOTE,
} from './safety';

export function buildResultText(
  r: ComputedResult,
  computedAt?: string,
): string {
  const lines: string[] = [];
  lines.push('【小儿剂量助手 · 数学计算结果（待复核）】');
  lines.push(`计算模式：${MODE_LABELS[r.calcMode]}`);

  if (r.ageYears !== null || r.ageMonths !== null) {
    lines.push(`年龄：${formatAge(r.ageYears, r.ageMonths)}（仅记录与风险提示，不参与剂量计算）`);
  }
  lines.push(
    `体重：${formatNumber(r.weightInput, 2)} ${r.weightUnit}（内部统一换算 ${formatNumber(r.weightKg, 3)} kg）`,
  );
  if (r.heightInput !== null) {
    lines.push(
      `身高：${formatNumber(r.heightInput, 2)} ${r.heightUnit}（内部统一换算 ${formatNumber(r.heightCm, 2)} cm）`,
    );
  }
  if (r.bsa !== null) {
    lines.push(`体表面积（Mosteller，未舍入原始值 ${formatRawValue(r.bsa)} m²）：${formatNumber(r.bsa, 3, 3)} m²`);
  }

  lines.push('');
  lines.push('—— 人工录入剂量参数 ——');
  lines.push(`药物模板：${r.templateName}${r.fictional ? `（${FICTIONAL_NOTE}）` : ''}`);
  lines.push(`剂量参数：${formatNumber(r.dosePerUnit, 4)} ${doseParamUnit(r.calcMode)}`);
  lines.push(`每日给药次数：${r.timesPerDay} 次/日`);
  if (r.maxSingleDose !== null) {
    lines.push(`单次最大剂量（人工录入）：${formatNumber(r.maxSingleDose, 3)} mg/次`);
  }
  if (r.maxDailyDose !== null) {
    lines.push(`每日最大剂量（人工录入）：${formatNumber(r.maxDailyDose, 3)} mg/日`);
  }
  if (r.concentration !== null) {
    lines.push(`制剂浓度：${formatNumber(r.concentration, 3)} mg/mL`);
  }
  if (r.notes) {
    lines.push(`备注：${r.notes}`);
  }

  lines.push('');
  lines.push('—— 数学计算结果（待复核，非推荐剂量） ——');
  lines.push(`单次数学计算剂量：${formatNumber(r.singleDose, 3)} mg/次（原始值 ${formatRawValue(r.singleDose)} mg/次）`);
  lines.push(`每日数学计算总量：${formatNumber(r.dailyDose, 3)} mg/日（原始值 ${formatRawValue(r.dailyDose)} mg/日）`);
  if (r.volumePerDose !== null) {
    lines.push(
      `每次液体体积：${formatNumber(r.volumePerDose, 3)} mL/次（原始计算值 ${formatRawValue(r.volumePerDose)} mL/次）`,
    );
  }

  lines.push('');
  lines.push('—— 安全校验 ——');
  if (r.singleExceeded) {
    lines.push(`[超限-单次] ${SINGLE_MAX_WARNING}`);
    lines.push(`  原始数学计算结果：${formatRawValue(r.singleDose)} mg/次`);
    lines.push(`  人工录入上限：${formatNumber(r.maxSingleDose, 3)} mg/次`);
    lines.push(`  超出差值：${formatRawValue(r.singleExceedDiff)} mg/次`);
    lines.push('  状态：需要专业复核（本工具未自动修正结果）');
  }
  if (r.dailyExceeded) {
    lines.push(`[超限-每日] ${DAILY_MAX_WARNING}`);
    lines.push(`  原始数学计算结果：${formatRawValue(r.dailyDose)} mg/日`);
    lines.push(`  人工录入上限：${formatNumber(r.maxDailyDose, 3)} mg/日`);
    lines.push(`  超出差值：${formatRawValue(r.dailyExceedDiff)} mg/日`);
    lines.push('  状态：需要专业复核（本工具未自动修正结果）');
  }
  if (!r.source) {
    lines.push(`[警告] ${SOURCE_MISSING_WARNING}`);
  }
  if (r.reviewStatus === '未审核') {
    lines.push(`[警告] ${UNREVIEWED_WARNING}`);
  }
  if (r.fictional) {
    lines.push(`[提示] ${FICTIONAL_NOTE}`);
  }
  if (r.volumePerDose !== null) {
    lines.push(`[提示] ${VOLUME_NOTE}`);
  }
  for (const w of r.inputWarnings) {
    lines.push(`[录入核对] ${w}`);
  }

  lines.push('');
  lines.push('—— 数据来源 ——');
  lines.push(`来源：${r.source || '（未填写）'}`);
  lines.push(`来源版本/发布日期：${r.sourceVersion || '（未填写）'}`);
  lines.push(`模板审核状态：${r.reviewStatus}`);
  lines.push(`计算时间：${formatDateTime(computedAt ?? new Date().toISOString())}`);

  lines.push('');
  lines.push('—— 完整计算过程 ——');
  r.steps.forEach((s, i) => {
    lines.push(`${i + 1}. ${s.label}：${s.expression}`);
    if (s.value !== null) {
      lines.push(`   未提前舍入原始值：${formatRawValue(s.value)} ${s.unit ?? ''}`);
    }
  });
  lines.push('注：计算全部使用未提前四舍五入的中间值，仅展示时舍入；舍入不改变数学计算结果与超限判定。');

  lines.push('');
  lines.push(`安全声明：${SAFETY_DISCLAIMER}`);
  lines.push('本工具不提供诊断、处方或真实临床决策；不得仅凭年龄、体重或体表面积给出用药结论。');

  return lines.join('\n');
}

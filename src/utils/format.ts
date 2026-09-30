/**
 * 数字与时间格式化工具。
 *
 * 舍入政策：
 * - 计算过程一律使用未提前四舍五入的原始值；
 * - 仅在最终展示时按需保留小数位（默认最多 3 位，体表面积固定 3 位）；
 * - 舍入只影响显示，不影响数学计算结果，也不改变超限判定。
 */

/** 格式化显示值（默认最多 3 位小数，去除无效尾随 0 的策略由 toLocaleString 处理） */
export function formatNumber(
  value: number | null | undefined,
  maxDecimals = 3,
  minDecimals = 0,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—';
  }
  const factor = 10 ** maxDecimals;
  const rounded = Math.round((value + Number.EPSILON) * factor) / factor;
  return rounded.toLocaleString('zh-CN', {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  });
}

/** 体表面积显示：固定保留 3 位小数 */
export function formatBSA(value: number | null | undefined): string {
  return formatNumber(value, 3, 3);
}

/** 未提前舍入的原始值展示（默认最多 6 位小数，去除尾随 0） */
export function formatRawValue(
  value: number | null | undefined,
  maxDecimals = 6,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—';
  }
  const fixed = value.toFixed(maxDecimals);
  return fixed.replace(/0+$/, '').replace(/\.$/, '');
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** ISO 时间 → 本地可读时间 */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(
    d.getHours(),
  )}:${pad2(d.getMinutes())}`;
}

/** 年龄展示（年龄只用于记录与风险提示，不参与剂量计算） */
export function formatAge(
  years: number | null,
  months: number | null,
): string {
  if (years === null && months === null) {
    return '未填写';
  }
  const y = years ?? 0;
  const m = months ?? 0;
  if (y > 0 && m > 0) return `${y} 岁 ${m} 个月`;
  if (y > 0) return `${y} 岁`;
  if (m > 0) return `${m} 个月`;
  return '不足 1 个月';
}

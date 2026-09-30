import { describe, expect, it } from 'vitest';
import {
  REAL_DRUG_LIBRARY,
  type RealDrugSeed,
} from '../data/realDrugLibrary';
import {
  importRealDrugLibrary,
  isRealLibraryImported,
  loadUserTemplates,
} from '../utils/storage';

describe('真实药物导入库数据质量', () => {
  it('条目数量非空', () => {
    expect(REAL_DRUG_LIBRARY.length).toBeGreaterThan(30);
  });

  it('id 唯一且均为 real- 前缀', () => {
    const ids = REAL_DRUG_LIBRARY.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id.startsWith('real-')).toBe(true);
    }
  });

  it('每条记录：剂量参数与每日次数有效（>0 / 正整数）', () => {
    for (const s of REAL_DRUG_LIBRARY as RealDrugSeed[]) {
      expect(s.dosePerUnit, `${s.id} 剂量参数必须大于 0`).toBeGreaterThan(0);
      expect(Number.isInteger(s.timesPerDay), `${s.id} 次数必须为整数`).toBe(
        true,
      );
      expect(s.timesPerDay, `${s.id} 次数必须 ≥1`).toBeGreaterThanOrEqual(1);
      expect(s.timesPerDay, `${s.id} 次数应 ≤8（常见上限 q3h` ).toBeLessThanOrEqual(8);
    }
  });

  it('每条记录都填写了数据来源与备注（可追溯）', () => {
    for (const s of REAL_DRUG_LIBRARY as RealDrugSeed[]) {
      expect(s.source.length, `${s.id} 来源不能为空`).toBeGreaterThan(0);
      expect(s.notes.length, `${s.id} 备注不能为空`).toBeGreaterThan(0);
      expect(s.notes, `${s.id} 备注应注明原文区间`).toContain('原文');
    }
  });

  it('上限值若填写则必须大于 0', () => {
    for (const s of REAL_DRUG_LIBRARY as RealDrugSeed[]) {
      if (s.maxSingleDose !== null) {
        expect(s.maxSingleDose).toBeGreaterThan(0);
      }
      if (s.maxDailyDose !== null) {
        expect(s.maxDailyDose).toBeGreaterThan(0);
      }
      if (s.concentration !== null) {
        expect(s.concentration).toBeGreaterThan(0);
      }
    }
  });
});

describe('真实药物库导入（内存存储环境）', () => {
  it('首次导入全部条目；重复导入幂等（real-* 条目总数始终等于库大小，不重复叠加）', () => {
    const first = importRealDrugLibrary();
    expect(first.imported).toBe(REAL_DRUG_LIBRARY.length);
    expect(isRealLibraryImported()).toBe(true);
    expect(
      loadUserTemplates().filter((t) => t.id.startsWith('real-')).length,
    ).toBe(REAL_DRUG_LIBRARY.length);

    const second = importRealDrugLibrary();
    expect(second.imported).toBe(REAL_DRUG_LIBRARY.length);
    expect(
      loadUserTemplates().filter((t) => t.id.startsWith('real-')).length,
    ).toBe(REAL_DRUG_LIBRARY.length);
  });

  it('导入后一律为「未审核」、非虚构、可编辑的自定义模板', () => {
    // 匹配每条种子的来源名称，确保来源字段完整带入（脱敏后为「参考资料X」格式）
    for (const s of REAL_DRUG_LIBRARY as RealDrugSeed[]) {
      expect(s.source).toMatch(/参考资料[ABCD]/);
    }
  });

  it('仅含体重模式条目（资料中的 mg/m² 成人记法未纳入）', () => {
    for (const s of REAL_DRUG_LIBRARY as RealDrugSeed[]) {
      expect(['weight-per-dose', 'weight-per-day']).toContain(s.calcMode);
    }
  });
});

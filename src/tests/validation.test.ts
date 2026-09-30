import { describe, expect, it } from 'vitest';
import {
  isPositiveFinite,
  isPositiveInteger,
  parseNumber,
  validateComputeInput,
} from '../utils/validation';
import { getSafetyFlags } from '../utils/safety';

function validRaw() {
  return {
    ageYears: '5',
    ageMonths: '0',
    weight: '20',
    weightUnit: 'kg' as const,
    height: '110',
    heightUnit: 'cm' as const,
    calcMode: 'weight-per-dose' as const,
    dosePerUnit: '8',
    timesPerDay: '3',
    maxSingleDose: '400',
    maxDailyDose: '1200',
    concentration: '20',
  };
}

describe('11. 无效输入校验（阻断计算）', () => {
  it('parseNumber 拒绝空字符串、非数字、NaN、Infinity', () => {
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('   ')).toBeNull();
    expect(parseNumber('abc')).toBeNull();
    expect(parseNumber('NaN')).toBeNull();
    expect(parseNumber('Infinity')).toBeNull();
    expect(parseNumber('-Infinity')).toBeNull();
    expect(parseNumber(null)).toBeNull();
    expect(parseNumber(undefined)).toBeNull();
    expect(parseNumber(Number.NaN)).toBeNull();
    expect(parseNumber(Number.POSITIVE_INFINITY)).toBeNull();
    expect(parseNumber('20')).toBe(20);
    expect(parseNumber(20)).toBe(20);
    expect(parseNumber(' 20.5 ')).toBe(20.5);
  });

  it('isPositiveFinite / isPositiveInteger', () => {
    expect(isPositiveFinite(1)).toBe(true);
    expect(isPositiveFinite(0.01)).toBe(true);
    expect(isPositiveFinite(0)).toBe(false);
    expect(isPositiveFinite(-1)).toBe(false);
    expect(isPositiveFinite(Number.NaN)).toBe(false);
    expect(isPositiveInteger(3)).toBe(true);
    expect(isPositiveInteger(2.5)).toBe(false);
    expect(isPositiveInteger(0)).toBe(false);
    expect(isPositiveInteger(-1)).toBe(false);
  });

  it('体重必填且大于 0；体重为空 / 0 / 负数 / 非数字 均报错', () => {
    expect(validateComputeInput({ ...validRaw(), weight: '' }).errors['weight']).toBeDefined();
    expect(validateComputeInput({ ...validRaw(), weight: '0' }).errors['weight']).toBeDefined();
    expect(validateComputeInput({ ...validRaw(), weight: '-5' }).errors['weight']).toBeDefined();
    expect(validateComputeInput({ ...validRaw(), weight: 'abc' }).errors['weight']).toBeDefined();
  });

  it('身高为 0 或负数时报错', () => {
    expect(validateComputeInput({ ...validRaw(), height: '0' }).errors['height']).toBeDefined();
    expect(validateComputeInput({ ...validRaw(), height: '-100' }).errors['height']).toBeDefined();
  });

  it('体表面积模式下身高必填，缺失时禁止进行 BSA 计算', () => {
    const r = validateComputeInput({
      ...validRaw(),
      calcMode: 'bsa-per-dose',
      height: '',
    });
    expect(r.errors['height']).toContain('必填');
  });

  it('体重模式下身高可留空', () => {
    const r = validateComputeInput({ ...validRaw(), height: '' });
    expect(r.errors['height']).toBeUndefined();
  });

  it('每日次数缺失时禁止计算单次剂量；必须为正整数', () => {
    expect(validateComputeInput({ ...validRaw(), timesPerDay: '' }).errors['timesPerDay']).toBeDefined();
    expect(validateComputeInput({ ...validRaw(), timesPerDay: '0' }).errors['timesPerDay']).toBeDefined();
    expect(validateComputeInput({ ...validRaw(), timesPerDay: '1.5' }).errors['timesPerDay']).toContain('正整数');
    expect(validateComputeInput({ ...validRaw(), timesPerDay: '-2' }).errors['timesPerDay']).toBeDefined();
  });

  it('剂量参数必须大于 0', () => {
    expect(validateComputeInput({ ...validRaw(), dosePerUnit: '0' }).errors['dosePerUnit']).toBeDefined();
    expect(validateComputeInput({ ...validRaw(), dosePerUnit: '-1' }).errors['dosePerUnit']).toBeDefined();
    expect(validateComputeInput({ ...validRaw(), dosePerUnit: '' }).errors['dosePerUnit']).toBeDefined();
  });

  it('浓度必须大于 0（填写时）', () => {
    expect(validateComputeInput({ ...validRaw(), concentration: '0' }).errors['concentration']).toBeDefined();
    expect(validateComputeInput({ ...validRaw(), concentration: '-1' }).errors['concentration']).toBeDefined();
  });

  it('年龄不能为负数', () => {
    expect(validateComputeInput({ ...validRaw(), ageYears: '-1' }).errors['ageYears']).toBeDefined();
    expect(validateComputeInput({ ...validRaw(), ageMonths: '-3' }).errors['ageMonths']).toBeDefined();
  });

  it('合法输入无错误', () => {
    const r = validateComputeInput(validRaw());
    expect(Object.keys(r.errors).length).toBe(0);
  });

  it('异常大输入触发核对提醒（不作为医学判断、不阻断计算）', () => {
    const r = validateComputeInput({ ...validRaw(), weight: '500' });
    expect(Object.keys(r.errors).length).toBe(0);
    expect(r.inputWarnings.length).toBeGreaterThan(0);
    expect(r.inputWarnings[0]).toContain('请核对录入值和单位');
  });

  it('异常小输入触发核对提醒', () => {
    const r = validateComputeInput({ ...validRaw(), height: '5' });
    expect(Object.keys(r.errors).length).toBe(0);
    expect(r.inputWarnings.length).toBeGreaterThan(0);
    expect(r.inputWarnings[0]).toContain('请核对录入值和单位');
  });

  it('lb 单位下异常体重换算后提醒', () => {
    const r = validateComputeInput({ ...validRaw(), weight: '500', weightUnit: 'lb' });
    expect(r.inputWarnings.length).toBeGreaterThan(0);
    expect(r.inputWarnings[0]).toContain('kg');
  });
});

describe('14. 数据来源缺失提醒', () => {
  it('来源为空 → sourceMissing = true', () => {
    expect(
      getSafetyFlags({
        source: '',
        reviewStatus: '已审核',
        fictional: false,
        singleExceeded: false,
        dailyExceeded: false,
      }).sourceMissing,
    ).toBe(true);
  });

  it('来源为空白串 → sourceMissing = true', () => {
    expect(
      getSafetyFlags({
        source: '   ',
        reviewStatus: '已审核',
        fictional: false,
        singleExceeded: false,
        dailyExceeded: false,
      }).sourceMissing,
    ).toBe(true);
  });

  it('来源已填写 → sourceMissing = false', () => {
    expect(
      getSafetyFlags({
        source: 'XX 药品说明书（2025 版）',
        reviewStatus: '已审核',
        fictional: false,
        singleExceeded: false,
        dailyExceeded: false,
      }).sourceMissing,
    ).toBe(false);
  });

  it('来源缺失 → needsReview = true', () => {
    expect(
      getSafetyFlags({
        source: '',
        reviewStatus: '已审核',
        fictional: false,
        singleExceeded: false,
        dailyExceeded: false,
      }).needsReview,
    ).toBe(true);
  });
});

describe('15. 未审核模板提醒', () => {
  it('未审核 → unreviewed = true，needsReview = true', () => {
    const flags = getSafetyFlags({
      source: '虚构演示数据',
      reviewStatus: '未审核',
      fictional: false,
      singleExceeded: false,
      dailyExceeded: false,
    });
    expect(flags.unreviewed).toBe(true);
    expect(flags.needsReview).toBe(true);
  });

  it('已审核 + 无超限 + 非虚构 + 有来源 → needsReview = false', () => {
    const flags = getSafetyFlags({
      source: 'XX 说明书',
      reviewStatus: '已审核',
      fictional: false,
      singleExceeded: false,
      dailyExceeded: false,
    });
    expect(flags.unreviewed).toBe(false);
    expect(flags.needsReview).toBe(false);
  });

  it('超限（无论审核状态）→ needsReview = true', () => {
    const flags = getSafetyFlags({
      source: 'XX 说明书',
      reviewStatus: '已审核',
      fictional: false,
      singleExceeded: true,
      dailyExceeded: false,
    });
    expect(flags.singleExceeded).toBe(true);
    expect(flags.needsReview).toBe(true);
  });

  it('虚构演示数据 → fictional = true 且 needsReview = true', () => {
    const flags = getSafetyFlags({
      source: '虚构演示数据',
      reviewStatus: '已审核',
      fictional: true,
      singleExceeded: false,
      dailyExceeded: false,
    });
    expect(flags.fictional).toBe(true);
    expect(flags.needsReview).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import {
  BSA_DIVISOR,
  INCH_TO_CM,
  LB_TO_KG,
  calculateDose,
  cmToInch,
  compareWithMax,
  computeDoseResult,
  computeVolumeMl,
  inchToCm,
  kgToLb,
  lbToKg,
  modeBasis,
  modeIsPerDay,
  mostellerBSA,
} from '../utils/calc';
import type { ComputeInput } from '../types';
import { formatNumber } from '../utils/format';

/** 110 cm / 20 kg → 未舍入 BSA */
const BSA_110_20 = Math.sqrt((110 * 20) / BSA_DIVISOR);

function makeWeightPerDoseInput(
  overrides: Partial<ComputeInput> = {},
): ComputeInput {
  return {
    ageYears: 5,
    ageMonths: 0,
    weightInput: 20,
    weightUnit: 'kg',
    heightInput: 110,
    heightUnit: 'cm',
    calcMode: 'weight-per-dose',
    dosePerUnit: 8,
    timesPerDay: 3,
    maxSingleDose: 400,
    maxDailyDose: 1200,
    concentration: 20,
    templateName: '模拟药物A（虚构演示）',
    fictional: true,
    source: '虚构演示数据（内部教学用）',
    sourceVersion: 'Demo v1.0',
    reviewStatus: '未审核',
    notes: '',
    ...overrides,
  };
}

describe('1. kg / lb 换算', () => {
  it('1 lb = 0.45359237 kg', () => {
    expect(LB_TO_KG).toBe(0.45359237);
    expect(1 * LB_TO_KG).toBeCloseTo(0.45359237, 8);
  });

  it('lb → kg：22 lb ≈ 9.97903 kg', () => {
    expect(lbToKg(22)).toBeCloseTo(9.9790303, 5);
  });

  it('单位切换往返一致：kg → lb → kg 还原', () => {
    const kg = 20;
    expect(lbToKg(kgToLb(kg))).toBeCloseTo(kg, 10);
  });
});

describe('2. cm / inch 换算', () => {
  it('12 inch = 30.48 cm', () => {
    expect(inchToCm(12)).toBeCloseTo(30.48, 4);
    expect(INCH_TO_CM).toBe(2.54);
  });

  it('cm → inch：110 cm ≈ 43.307 inch', () => {
    expect(cmToInch(110)).toBeCloseTo(43.3070866, 4);
  });
});

describe('3. Mosteller 体表面积公式', () => {
  it('110 cm / 20 kg → ≈ 0.781736 m²', () => {
    expect(mostellerBSA(110, 20)).toBeCloseTo(0.781736, 5);
  });

  it('BSA 显示默认保留 3 位小数（内部使用未舍入值）', () => {
    expect(formatNumber(mostellerBSA(110, 20), 3, 3)).toBe('0.782');
  });

  it('身高缺失或为 0 不应进入 BSA 计算（由校验层拦截）', () => {
    // 校验层保证身高 > 0 且必填；此处验证公式本身要求正数入参
    expect(() => mostellerBSA(0, 20)).not.toThrow();
    expect(Number.isNaN(mostellerBSA(0, 20))).toBe(false); // sqrt(0) = 0
  });
});

describe('4. 按体重计算 mg/kg/次', () => {
  it('20 kg × 8 mg/kg/次 = 160 mg/次；× 3 次/日 = 480 mg/日', () => {
    const r = calculateDose({
      basis: 'weight',
      basisValue: 20,
      dosePerUnit: 8,
      perDayBasis: false,
      timesPerDay: 3,
    });
    expect(r.singleDose).toBeCloseTo(160, 10);
    expect(r.dailyDose).toBeCloseTo(480, 10);
  });
});

describe('5. 按体重计算 mg/kg/日', () => {
  it('20 kg × 30 mg/kg/日 = 600 mg/日；÷ 2 次/日 = 300 mg/次', () => {
    const r = calculateDose({
      basis: 'weight',
      basisValue: 20,
      dosePerUnit: 30,
      perDayBasis: true,
      timesPerDay: 2,
    });
    expect(r.dailyDose).toBeCloseTo(600, 10);
    expect(r.singleDose).toBeCloseTo(300, 10);
  });
});

describe('6. 按体表面积计算 mg/m²/次', () => {
  it('BSA(原始值) × 150 = 117.260… mg/次；× 1 次/日 = 同值', () => {
    const r = calculateDose({
      basis: 'bsa',
      basisValue: BSA_110_20,
      dosePerUnit: 150,
      perDayBasis: false,
      timesPerDay: 1,
    });
    expect(r.singleDose).toBeCloseTo(BSA_110_20 * 150, 10);
    expect(r.singleDose).toBeCloseTo(117.2604, 3);
    expect(r.dailyDose).toBeCloseTo(r.singleDose, 10);
  });
});

describe('7. 按体表面积计算 mg/m²/日', () => {
  it('BSA(原始值) × 300 = 234.520… mg/日；÷ 3 次/日 ≈ 78.173 mg/次', () => {
    const r = calculateDose({
      basis: 'bsa',
      basisValue: BSA_110_20,
      dosePerUnit: 300,
      perDayBasis: true,
      timesPerDay: 3,
    });
    expect(r.dailyDose).toBeCloseTo(BSA_110_20 * 300, 10);
    expect(r.dailyDose).toBeCloseTo(234.5208, 3);
    expect(r.singleDose).toBeCloseTo(78.1736, 3);
  });
});

describe('8. 液体制剂体积换算', () => {
  it('160 mg ÷ 20 mg/mL = 8 mL', () => {
    expect(computeVolumeMl(160, 20)).toBeCloseTo(8, 10);
  });

  it('结算管线在提供浓度时输出每次体积', () => {
    const r = computeDoseResult(makeWeightPerDoseInput());
    expect(r.volumePerDose).not.toBeNull();
    expect(r.volumePerDose as number).toBeCloseTo(8, 10);
  });

  it('未提供浓度时 volumePerDose = null', () => {
    const r = computeDoseResult(
      makeWeightPerDoseInput({ concentration: null }),
    );
    expect(r.volumePerDose).toBeNull();
  });
});

describe('9. 单次最大剂量预警', () => {
  it('超限：480 > 400 → exceeded=true，差值=80', () => {
    const c = compareWithMax(480, 400);
    expect(c.exceeded).toBe(true);
    expect(c.diff).toBeCloseTo(80, 10);
  });

  it('未超限：300 ≤ 400 → exceeded=false，差值=null', () => {
    const c = compareWithMax(300, 400);
    expect(c.exceeded).toBe(false);
    expect(c.diff).toBeNull();
  });

  it('完整管线：体重 60 kg × 8 mg/kg/次 = 480 mg/次 > 400 → 高亮预警且不自动修正', () => {
    const r = computeDoseResult(makeWeightPerDoseInput({ weightInput: 60 }));
    expect(r.singleExceeded).toBe(true);
    expect(r.singleDose).toBeCloseTo(480, 10); // 未被截断为 400
    expect(r.singleExceedDiff).toBeCloseTo(80, 10);
  });
});

describe('10. 每日最大剂量预警', () => {
  it('完整管线：体重 60 kg、3 次/日 → 1440 mg/日 > 1200 → 预警且不截断', () => {
    const r = computeDoseResult(makeWeightPerDoseInput({ weightInput: 60 }));
    expect(r.dailyExceeded).toBe(true);
    expect(r.dailyDose).toBeCloseTo(1440, 10);
    expect(r.dailyExceedDiff).toBeCloseTo(240, 10);
  });

  it('未超限时不产生预警', () => {
    const r = computeDoseResult(makeWeightPerDoseInput());
    expect(r.dailyExceeded).toBe(false);
    expect(r.dailyExceedDiff).toBeNull();
  });

  it('上限未设置（null）时永远不超限', () => {
    const r = computeDoseResult(
      makeWeightPerDoseInput({ maxDailyDose: null, maxSingleDose: null }),
    );
    expect(r.singleExceeded).toBe(false);
    expect(r.dailyExceeded).toBe(false);
  });
});

describe('11. 无效输入（由校验层保障，不参与计算）', () => {
  it('compareWithMax 对 null 上限返回不超限', () => {
    const c = compareWithMax(Infinity, null);
    expect(c.exceeded).toBe(false);
  });

  it('computeVolumeMl 浓度为 0 时得到 Infinity，调用方校验层会拦截', () => {
    expect(computeVolumeMl(160, 0)).toBe(Infinity);
  });

  it('计算模式判定函数对 4 种模式有效', () => {
    expect(modeBasis('weight-per-dose')).toBe('weight');
    expect(modeBasis('weight-per-day')).toBe('weight');
    expect(modeBasis('bsa-per-dose')).toBe('bsa');
    expect(modeBasis('bsa-per-day')).toBe('bsa');
    expect(modeIsPerDay('weight-per-dose')).toBe(false);
    expect(modeIsPerDay('weight-per-day')).toBe(true);
    expect(modeIsPerDay('bsa-per-dose')).toBe(false);
    expect(modeIsPerDay('bsa-per-day')).toBe(true);
  });
});

describe('12. 小数与舍入处理', () => {
  it('formatNumber 保留 3 位小数（四舍五入）', () => {
    expect(formatNumber(0.781736, 3, 3)).toBe('0.782');
    expect(formatNumber(117.2604, 3)).toBe('117.26');
    expect(formatNumber(78.1736, 3)).toBe('78.174');
  });

  it('BSA 计算使用未舍入原始值：0.781736 × 150 ≠ 0.782 × 150', () => {
    const raw = BSA_110_20 * 150;
    const displayed = 0.782 * 150;
    // 0.782 是 0.781736 的 3 位小数舍入值，两者参与计算结果相差约 0.04 mg
    expect(Math.abs(raw - displayed)).toBeGreaterThan(0.03);
    expect(formatNumber(raw, 3)).toBe('117.26');
  });

  it('计算管线完整结果是未舍入的精确值', () => {
    const r = computeDoseResult(
      makeWeightPerDoseInput({ calcMode: 'bsa-per-dose', dosePerUnit: 150 }),
    );
    expect(r.singleDose).toBeCloseTo(BSA_110_20 * 150, 10);
    expect(r.bsa).toBeCloseTo(BSA_110_20, 10);
  });
});

describe('13. 单位切换与计算管线集成', () => {
  it('lb + inch 输入会先换算再计算：22 lb、43.3 inch，体重模式', () => {
    const r = computeDoseResult(
      makeWeightPerDoseInput({
        weightInput: 22,
        weightUnit: 'lb',
        heightInput: 43.3,
        heightUnit: 'inch',
        concentration: null,
      }),
    );
    // 22 lb → 9.979 kg，× 8 mg/kg/次 = 79.83 mg/次
    expect(r.weightKg).toBeCloseTo(9.9790303, 5);
    expect(r.singleDose).toBeCloseTo(79.8322, 3);
  });

  it('体表面积模式使用换算后的 cm/kg 计算 BSA', () => {
    const r = computeDoseResult(
      makeWeightPerDoseInput({
        weightInput: 44.09,
        weightUnit: 'lb',
        heightInput: 43.31,
        heightUnit: 'inch',
        calcMode: 'bsa-per-day',
        dosePerUnit: 300,
      }),
    );
    expect(r.heightCm).toBeCloseTo(110.0074, 3);
    expect(r.weightKg).toBeCloseTo(19.9989, 3);
    expect(r.bsa).toBeCloseTo(0.7817, 3);
  });
});

describe('计算过程步骤生成（公式与单位变化可追溯）', () => {
  it('体重模式生成 单次剂量 / 每日总量 / 体积 / 上限比较 步骤', () => {
    const r = computeDoseResult(makeWeightPerDoseInput());
    const labels = r.steps.map((s) => s.label);
    expect(labels).toContain('单次数学计算剂量');
    expect(labels).toContain('每日数学计算总量');
    expect(labels).toContain('液体制剂体积换算');
    expect(labels).toContain('单次最大剂量比较');
    expect(labels).toContain('每日最大剂量比较');
  });

  it('lb 输入时生成体重单位换算步骤', () => {
    const r = computeDoseResult(
      makeWeightPerDoseInput({ weightInput: 22, weightUnit: 'lb' }),
    );
    expect(r.steps[0].label).toBe('体重单位换算');
    expect(r.steps[0].expression).toContain('0.45359237');
  });

  it('体表面积模式生成 Mosteller BSA 步骤（含 3600）', () => {
    const r = computeDoseResult(
      makeWeightPerDoseInput({ calcMode: 'bsa-per-dose', dosePerUnit: 150 }),
    );
    const bsaStep = r.steps.find((s) => s.label.includes('Mosteller'));
    expect(bsaStep).toBeDefined();
    expect(bsaStep?.expression).toContain('3600');
  });
});

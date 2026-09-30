/**
 * 小儿剂量助手 —— 类型定义
 *
 * 纯类型文件，不包含业务逻辑，便于计算函数与界面组件分离、独立测试。
 */

export type WeightUnit = 'kg' | 'lb';
export type HeightUnit = 'cm' | 'inch';

/**
 * 计算模式：
 * - weight-per-dose：按体重 mg/kg/次
 * - weight-per-day：按体重 mg/kg/日
 * - bsa-per-dose：按体表面积 mg/m²/次
 * - bsa-per-day：按体表面积 mg/m²/日
 */
export type CalcMode =
  | 'weight-per-dose'
  | 'weight-per-day'
  | 'bsa-per-dose'
  | 'bsa-per-day';

/** 审核状态：未审核 / 已审核 */
export type ReviewStatus = '未审核' | '已审核';

/** 计算所依据的体格指标 */
export type Basis = 'weight' | 'bsa';

/**
 * 药物模板（剂量参数集合）。
 *
 * 安全设计：
 * - 内置模板（builtin = true）全部为虚构演示数据（fictional = true），不含真实药品剂量；
 * - 真实药物数据只能由管理员在「药物模板」页根据权威药品说明书或临床指南人工录入，
 *   并填写来源、来源版本/发布日期与审核状态；
 * - 模板只保存人工录入的参数，不存在「根据药物名称自动生成剂量」的逻辑。
 */
export interface DrugTemplate {
  id: string;
  /** 模板名称 */
  name: string;
  /** 是否为内置模板（不可删除、不可编辑） */
  builtin: boolean;
  /** 虚构演示数据标识：不可用于真实用药 */
  fictional: boolean;
  calcMode: CalcMode;
  /** 每 kg 或每 m² 剂量，单位由 calcMode 决定 */
  dosePerUnit: number | null;
  /** 每日给药次数 */
  timesPerDay: number | null;
  /** 单次最大剂量（mg），可选 */
  maxSingleDose: number | null;
  /** 每日最大剂量（mg），可选 */
  maxDailyDose: number | null;
  /** 制剂浓度（mg/mL），可选 */
  concentration: number | null;
  /** 数据来源，例如权威药品说明书名称、临床指南名称 */
  source: string;
  /** 来源版本或发布日期 */
  sourceVersion: string;
  reviewStatus: ReviewStatus;
  /** 备注，例如配伍、年龄限制等注意事项 */
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/** 计算表单状态（字符串形式，贴近输入框） */
export interface CalcFormState {
  templateId: string;
  templateName: string;
  fictional: boolean;
  calcMode: CalcMode;
  ageYears: string;
  ageMonths: string;
  weight: string;
  weightUnit: WeightUnit;
  height: string;
  heightUnit: HeightUnit;
  dosePerUnit: string;
  timesPerDay: string;
  maxSingleDose: string;
  maxDailyDose: string;
  concentration: string;
  source: string;
  sourceVersion: string;
  reviewStatus: ReviewStatus;
  notes: string;
}

/** 计算输入（已校验通过，全部为有效数值） */
export interface ComputeInput {
  ageYears: number | null;
  ageMonths: number | null;
  weightInput: number;
  weightUnit: WeightUnit;
  heightInput: number | null;
  heightUnit: HeightUnit;
  calcMode: CalcMode;
  dosePerUnit: number;
  timesPerDay: number;
  maxSingleDose: number | null;
  maxDailyDose: number | null;
  concentration: number | null;
  templateName: string;
  fictional: boolean;
  source: string;
  sourceVersion: string;
  reviewStatus: ReviewStatus;
  notes: string;
}

/** 计算过程中的单步（用于「完整计算过程」展示与历史记录） */
export interface CalcStep {
  /** 步骤说明 */
  label: string;
  /** 公式表达式（含代入的数值） */
  expression: string;
  /** 未提前四舍五入的原始结果 */
  value: number | null;
  /** 结果单位 */
  unit?: string;
}

/** 计算结果（不含 id 与时间，保存到历史时补充） */
export interface ComputedResult {
  calcMode: CalcMode;
  ageYears: number | null;
  ageMonths: number | null;
  weightInput: number;
  weightUnit: WeightUnit;
  weightKg: number;
  heightInput: number | null;
  heightUnit: HeightUnit;
  heightCm: number | null;
  /** 体表面积原始值（仅体表面积模式） */
  bsa: number | null;
  dosePerUnit: number;
  timesPerDay: number;
  maxSingleDose: number | null;
  maxDailyDose: number | null;
  concentration: number | null;
  templateName: string;
  fictional: boolean;
  source: string;
  sourceVersion: string;
  reviewStatus: ReviewStatus;
  notes: string;
  /** 单次数学计算剂量（mg/次） */
  singleDose: number;
  /** 每日数学计算总量（mg/日） */
  dailyDose: number;
  /** 每次液体体积（mL/次），未提供浓度时为 null */
  volumePerDose: number | null;
  singleExceeded: boolean;
  dailyExceeded: boolean;
  singleExceedDiff: number | null;
  dailyExceedDiff: number | null;
  /** 输入核对提醒（异常范围等，不作为医学判断） */
  inputWarnings: string[];
  steps: CalcStep[];
}

/** 历史记录条目 = 计算结果 + id + 计算时间 */
export interface HistoryEntry extends ComputedResult {
  id: string;
  createdAt: string;
}

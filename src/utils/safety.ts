/**
 * 医疗安全相关文案与状态标识。
 *
 * 规则：
 * - 结果统一称为「数学计算结果 / 待复核结果」，禁止出现「推荐剂量」「安全剂量」等表述；
 * - 超限不自动修正，仅高亮预警并要求专业复核；
 * - 来源缺失、未审核模板必须有显著警告；
 * - 内置模板为虚构演示数据。
 */

import type { ReviewStatus } from '../types';

/** 顶部与结果区域强制显示的安全声明 */
export const SAFETY_DISCLAIMER =
  '本工具仅用于教学演示和剂量计算复核，不能替代医生、药师判断，不可直接用于自行给儿童用药。';

/** 超出单次最大剂量时的红色警告（原文，勿改） */
export const SINGLE_MAX_WARNING =
  '数学计算结果超过模板中人工设置的单次最大剂量，请停止使用该结果并交由医生或药师复核。';

/** 超出每日最大剂量时的红色警告（原文，勿改） */
export const DAILY_MAX_WARNING =
  '数学计算结果超过模板中人工设置的每日最大剂量，请停止使用该结果并交由医生或药师复核。';

/** 数据来源缺失提醒 */
export const SOURCE_MISSING_WARNING =
  '剂量参数来源未填写。真实剂量参数必须依据最新权威药品说明书或临床规范人工录入，请补充来源后再使用该结果。';

/** 未审核模板提醒 */
export const UNREVIEWED_WARNING =
  '当前模板处于「未审核」状态，数学计算结果仅供演示，必须由具备资质的医生或药师复核后方可参考。';

/** 虚构演示数据标识 */
export const FICTIONAL_NOTE = '虚构演示数据，不可用于真实用药';

/** 液体体积量取提醒 */
export const VOLUME_NOTE =
  '实际可量取体积及舍入方式必须由医生或药师确认，本工具不会将计算结果自动四舍五入到量具刻度。';

export interface SafetyParams {
  source: string;
  reviewStatus: ReviewStatus;
  fictional: boolean;
  singleExceeded: boolean;
  dailyExceeded: boolean;
}

export interface SafetyFlags {
  /** 数据来源未填写 */
  sourceMissing: boolean;
  /** 使用未审核模板 */
  unreviewed: boolean;
  /** 虚构演示数据 */
  fictional: boolean;
  /** 超出单次最大剂量 */
  singleExceeded: boolean;
  /** 超出每日最大剂量 */
  dailyExceeded: boolean;
  /** 是否需要专业复核 */
  needsReview: boolean;
}

export function getSafetyFlags(p: SafetyParams): SafetyFlags {
  const sourceMissing = !p.source || p.source.trim() === '';
  const unreviewed = p.reviewStatus === '未审核';
  return {
    sourceMissing,
    unreviewed,
    fictional: p.fictional,
    singleExceeded: p.singleExceeded,
    dailyExceeded: p.dailyExceeded,
    needsReview:
      sourceMissing ||
      unreviewed ||
      p.singleExceeded ||
      p.dailyExceeded ||
      p.fictional,
  };
}

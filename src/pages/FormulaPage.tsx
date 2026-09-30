import { WarningBox } from '../components/WarningBox';
import { SAFETY_DISCLAIMER } from '../utils/safety';

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="break-all font-num text-sm font-medium text-slate-900">
        {children}
      </p>
    </div>
  );
}

const SECTION_TITLE =
  'text-base font-bold text-slate-900';
const SUB_TITLE = 'mt-4 text-sm font-semibold text-slate-700';
const BODY = 'mt-2 space-y-2 text-sm leading-relaxed text-slate-600';

export function FormulaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">公式说明与安全声明</h1>
        <p className="mt-1 text-sm text-slate-500">
          本页公开列出全部计算公式与舍入政策，便于评委与使用者逐项复核。
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className={SECTION_TITLE}>A. 单位换算</h2>
        <div className={BODY}>
          <p>体重内部统一换算为 kg，身高内部统一换算为 cm，换算后参与所有计算。</p>
        </div>
        <div className="mt-3 space-y-2.5">
          <Formula>体重（kg） = 体重（lb） × 0.45359237</Formula>
          <Formula>身高（cm） = 身高（inch） × 2.54</Formula>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          示例：22 lb × 0.45359237 = 9.97903… kg；43.3 inch × 2.54 = 110.0 cm。
          单位切换后，输入值标签与内部换算结果保持一致。
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className={SECTION_TITLE}>B. 体表面积（Mosteller 公式）</h2>
        <div className="mt-3 space-y-2.5">
          <Formula>
            BSA（m²） = √[（身高 cm × 体重 kg） ÷ 3600]
          </Formula>
        </div>
        <div className={BODY}>
          <p>
            示例：身高 110 cm、体重 20 kg：
            √[（110 × 20） ÷ 3600] = √0.611111 = 0.781736… m²。
          </p>
          <p>
            显示政策：BSA 计算结果默认保留 <b>3 位小数</b>；
            后续剂量计算一律使用<b>未提前四舍五入的 BSA 原始值</b>，最终显示时再舍入。
          </p>
          <p>
            校验政策：体表面积模式下身高为必填项，身高缺失时禁止进行 BSA 计算。
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className={SECTION_TITLE}>C. 按体重计算剂量</h2>
        <h3 className={SUB_TITLE}>1. mg/kg/次（单次型）</h3>
        <div className="mt-2 space-y-2.5">
          <Formula>
            单次数学计算剂量（mg/次） = 体重（kg） × 每kg每次剂量（mg/kg/次）
          </Formula>
          <Formula>
            每日数学计算总量（mg/日） = 单次剂量（mg/次） × 每日次数
          </Formula>
        </div>
        <h3 className={SUB_TITLE}>2. mg/kg/日（每日型）</h3>
        <div className="mt-2 space-y-2.5">
          <Formula>
            每日数学计算总量（mg/日） = 体重（kg） × 每kg每日剂量（mg/kg/日）
          </Formula>
          <Formula>
            单次数学计算剂量（mg/次） = 每日总量（mg/日） ÷ 每日次数
          </Formula>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className={SECTION_TITLE}>D. 按体表面积计算剂量</h2>
        <h3 className={SUB_TITLE}>3. mg/m²/次（单次型）</h3>
        <div className="mt-2 space-y-2.5">
          <Formula>
            单次数学计算剂量（mg/次） = BSA（m²） × 每m²每次剂量（mg/m²/次）
          </Formula>
          <Formula>
            每日数学计算总量（mg/日） = 单次剂量（mg/次） × 每日次数
          </Formula>
        </div>
        <h3 className={SUB_TITLE}>4. mg/m²/日（每日型）</h3>
        <div className="mt-2 space-y-2.5">
          <Formula>
            每日数学计算总量（mg/日） = BSA（m²） × 每m²每日剂量（mg/m²/日）
          </Formula>
          <Formula>
            单次数学计算剂量（mg/次） = 每日总量（mg/日） ÷ 每日次数
          </Formula>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className={SECTION_TITLE}>E. 液体制剂体积换算</h2>
        <div className="mt-3 space-y-2.5">
          <Formula>
            每次体积（mL/次） = 单次剂量（mg/次） ÷ 制剂浓度（mg/mL）
          </Formula>
        </div>
        <div className={BODY}>
          <p>
            示例：单次剂量 160 mg、浓度 20 mg/mL：160 ÷ 20 = 8.0 mL/次。
          </p>
          <p>
            <b>不默认四舍五入到量具刻度</b>：仅显示原始计算值与格式化显示值，
            并提示「实际可量取体积及舍入方式必须由医生或药师确认」。
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className={SECTION_TITLE}>F. 最大剂量比较与预警</h2>
        <div className={BODY}>
          <p>
            当数学计算结果超过人工录入的单次最大剂量或每日最大剂量时，
            <b>不自动修正（截断）结果</b>，而是高亮预警并提示交由医生或药师复核，
            同时展示：原始数学计算结果、人工录入上限、差值、「需要专业复核」状态。
          </p>
        </div>
        <div className="mt-3">
          <WarningBox variant="danger" title="超限预警文案（单次）">
            数学计算结果超过模板中人工设置的单次最大剂量，请停止使用该结果并交由医生或药师复核。
          </WarningBox>
        </div>
        <div className="mt-2.5">
          <WarningBox variant="danger" title="超限预警文案（每日）">
            数学计算结果超过模板中人工设置的每日最大剂量，请停止使用该结果并交由医生或药师复核。
          </WarningBox>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className={SECTION_TITLE}>G. 舍入政策与异常输入提醒</h2>
        <div className={BODY}>
          <p>
            所有中间计算（kg、cm、BSA、剂量、体积）均使用未提前舍入的原始值；
            仅在最终展示时按需保留小数位（BSA 固定 3 位）。舍入不改变数学计算结果、
            超限判定与差值。
          </p>
          <p>
            异常大或异常小的输入（如体重超出 0.5–150 kg 提醒区间）会触发
            「请核对录入值和单位」提醒；<b>异常范围仅作为输入核对提醒，不作为医学判断</b>。
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className={SECTION_TITLE}>H. 安全声明</h2>
        <div className={BODY}>
          <p className="font-medium text-slate-800">{SAFETY_DISCLAIMER}</p>
          <p>
            计算结果统一称为「数学计算结果 / 待复核结果」，
            不使用「推荐剂量」「安全剂量」等可能构成医疗建议的表述；
            不得仅凭年龄、体重或体表面积给出「可以服用」或「建议服用」的结论。
          </p>
          <p>
            内置模板均为<b>虚构演示数据</b>，不包含真实儿童药品剂量；
            真实药物数据只能由管理员依据最新权威药品说明书或临床规范人工录入，
            并记录来源、版本、更新时间与审核状态。
          </p>
        </div>
      </section>
    </div>
  );
}

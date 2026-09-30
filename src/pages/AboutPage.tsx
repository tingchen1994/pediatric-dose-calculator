import { IconLock, IconShield } from '../components/Icons';
import { SAFETY_DISCLAIMER } from '../utils/safety';

const CARD = 'rounded-xl border border-slate-200 bg-white p-6 shadow-sm';
const H2 = 'text-base font-bold text-slate-900';
const LIST = 'mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600';

export function AboutPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">关于项目</h1>
        <p className="mt-1 text-sm text-slate-500">
          小儿剂量助手 Pediatric Dose Calculator · v1.0 · 教学演示与剂量计算复核工具
        </p>
      </div>

      <section className={CARD}>
        <h2 className={H2}>一句话介绍</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          一个纯前端、零后端、隐私优先的儿童药物剂量计算教学与复核 Demo：
          根据体重 / 体表面积与人工录入的剂量参数完成数学计算，完整展示计算过程、
          单位换算、上限预警与安全声明，帮助医学生与低年资医师养成「算—核—验」的用药复核习惯。
        </p>
      </section>

      <section className={CARD}>
        <h2 className={H2}>技术架构</h2>
        <ul className={LIST}>
          <li>React 18 + TypeScript（严格模式，构建零类型错误）</li>
          <li>Vite 5（开发与构建工具链）</li>
          <li>Tailwind CSS 3（原子化样式，响应式适配电脑与手机）</li>
          <li>React Router（Hash 路由，可部署到任意静态托管）</li>
          <li>Vitest（纯函数单元测试，计算逻辑与界面组件分离）</li>
          <li>localStorage（计算历史与自定义模板，默认不上传任何数据）</li>
        </ul>
      </section>

      <section className={CARD}>
        <h2 className={H2}>主要功能</h2>
        <ul className={LIST}>
          <li>四种计算模式：mg/kg/次、mg/kg/日、mg/m²/次、mg/m²/日</li>
          <li>lb↔kg、inch↔cm 单位换算并与显示保持一致</li>
          <li>Mosteller 体表面积公式（原始值参与计算、显示保留 3 位小数）</li>
          <li>液体制剂体积换算（不舍入到量具刻度）</li>
          <li>单次 / 每日最大剂量超限预警（不自动修正，展示差值与「需要专业复核」状态）</li>
          <li>完整计算过程折叠面板（逐步公式与单位变化）</li>
          <li>结果卡片支持复制（含安全声明与数据来源）与打印（隐藏无关导航）</li>
          <li>计算历史本地保存、查看 / 复制 / 删除 / 清空（二次确认）</li>
          <li>演示药物模板管理：8 个虚构演示模板 + 空白模板 + 用户自定义模板</li>
          <li>15 类单元测试覆盖计算、校验与安全标识</li>
        </ul>
      </section>

      <section className={CARD}>
        <div className="flex items-center gap-2">
          <IconShield className="h-5 w-5 text-teal-600" />
          <h2 className={H2}>医疗安全设计</h2>
        </div>
        <ul className={LIST}>
          <li>页面顶部与结果卡片显著标注安全声明，不提供诊断、处方或临床决策；</li>
          <li>以内置「模拟药物 A–H」等虚构演示数据演示全部流程，不含真实剂量；</li>
          <li>真实药物数据仅由管理员人工录入，强制记录来源、版本与审核状态；</li>
          <li>结果统一称「数学计算结果 / 待复核结果」，禁用「推荐剂量 / 安全剂量」；</li>
          <li>超限结果不自动修正，红色预警（图标+颜色+文字）并要求专业复核；</li>
          <li>来源缺失、未审核模板均有显著警告；年龄不参与剂量推断。</li>
        </ul>
      </section>

      <section className={CARD}>
        <div className="flex items-center gap-2">
          <IconLock className="h-5 w-5 text-teal-600" />
          <h2 className={H2}>数据与隐私设计</h2>
        </div>
        <ul className={LIST}>
          <li>无后端、无网络请求，计算全部在浏览器内完成；</li>
          <li>默认不保存姓名、病历号、联系方式等个人信息；</li>
          <li>历史与模板仅存于当前浏览器 localStorage，可随时清空；</li>
          <li>打印 / 复制内容仅包含计算过程、结果与安全声明。</li>
        </ul>
      </section>

      <section className={CARD}>
        <h2 className={H2}>本地运行</h2>
        <div className="mt-3 rounded-lg bg-slate-900 p-4 font-num text-xs leading-relaxed text-slate-100">
          <p># 安装依赖</p>
          <p>npm install</p>
          <p className="mt-2"># 启动开发服务器</p>
          <p>npm run dev</p>
          <p className="mt-2"># 运行单元测试</p>
          <p>npm test</p>
          <p className="mt-2"># 构建生产版本</p>
          <p>npm run build</p>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          GitHub 仓库（占位）：
          <span className="font-num text-teal-700">
            https://github.com/&lt;your-account&gt;/pediatric-dose-calculator
          </span>
        </p>
      </section>

      <section className={CARD}>
        <h2 className={H2}>免责声明</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          {SAFETY_DISCLAIMER}
          本 Demo 展示的是剂量数学计算与复核流程，不构成诊断、处方或用药建议；
          内置模板均为虚构演示数据，不可用于真实患者。真实场景中的药物、剂量、适应证、
          禁忌证、最大剂量和制剂浓度必须依据最新权威药品说明书或临床规范，
          由具备资质的医生或药师审核。本项目以 MIT 协议开源，仅按「现状」提供。
        </p>
      </section>
    </div>
  );
}

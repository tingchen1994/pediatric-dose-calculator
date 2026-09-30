/**
 * 页面级冒烟测试：验证五个页面与主要按钮在浏览器环境中真实可用。
 *
 * 运行：npm test（vitest）。此文件使用 jsdom 环境。
 */
// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import App from '../App';

const DISCLAIMER =
  '本工具仅用于教学演示和剂量计算复核，不能替代医生、药师判断，不可直接用于自行给儿童用药。';

beforeEach(() => {
  localStorage.clear();
  // jsdom 文档在测试间共享，重置 hash 路由到首页
  window.location.hash = '';
  // jsdom 未实现 window.print，打桩避免报错
  (window as unknown as { print: () => void }).print = () => {};
});

afterEach(() => {
  cleanup();
});

function setInputValue(id: string, value: string) {
  const el = document.getElementById(id) as HTMLInputElement | null;
  expect(el, `元素 #${id} 应存在`).not.toBeNull();
  fireEvent.change(el as HTMLInputElement, { target: { value } });
}

function setSelectValue(id: string, value: string) {
  const el = document.getElementById(id) as HTMLSelectElement | null;
  expect(el, `元素 #${id} 应存在`).not.toBeNull();
  fireEvent.change(el as HTMLSelectElement, { target: { value } });
}

function clickButtonByText(text: string) {
  const btn = screen.getByRole('button', { name: text });
  fireEvent.click(btn);
}

/** 文案可能出现在多处（横幅/页脚/结果卡片/步骤面板），仅断言存在 */
function expectExists(matcher: string | RegExp) {
  expect(screen.queryAllByText(matcher).length).toBeGreaterThan(0);
}

function expectMissing(matcher: string | RegExp) {
  expect(screen.queryAllByText(matcher).length).toBe(0);
}

function navigateTo(label: string) {
  const links = screen.getAllByRole('link', { name: label });
  fireEvent.click(links[0]);
}

describe('页面与按钮冒烟测试', () => {
  it('首页渲染：标题、安全声明、表单与禁用状态的计算按钮', () => {
    render(<App />);
    expectExists('小儿剂量助手');
    expectExists(DISCLAIMER);
    expectExists('剂量计算输入');
    expectExists(
      '模板仅用于自动填充人工录入的参数；本项目不会根据药物名称自动生成剂量。',
    );
    // 必填项缺失时计算按钮禁用
    expect(screen.getByRole('button', { name: '开始计算' })).toBeDisabled();
  });

  it('按体重计算演示：模板自动填充 → 计算 → 结果卡片', () => {
    render(<App />);
    setSelectValue('f-template', 'demo-a');
    setInputValue('f-weight', '20');
    expect(screen.getByRole('button', { name: '开始计算' })).toBeEnabled();
    clickButtonByText('开始计算');

    // 结果卡片核心数值（20 kg × 8 mg/kg/次；×3 次/日；160 ÷ 20 mg/mL）
    expectExists('数学计算结果');
    expectExists('160 mg/次');
    expectExists('480 mg/日');
    expectExists('8 mL/次');
    // 虚构演示数据警告
    expectExists(/虚构演示数据，不可用于真实用药/);
    // 计算过程折叠面板与操作按钮
    expectExists(/展开完整计算过程/);
    expect(
      screen.getByRole('button', { name: '复制结果' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '打印结果' }),
    ).toBeInTheDocument();
    // 复制按钮可点击（jsdom 中剪贴板降级，不应崩溃）
    clickButtonByText('复制结果');
  });

  it('计算历史：计算后写入历史页，支持展开、删除（含二次确认）', () => {
    render(<App />);
    setSelectValue('f-template', 'demo-a');
    setInputValue('f-weight', '20');
    clickButtonByText('开始计算');

    navigateTo('历史');
    expectExists(/共 1 条记录/);
    expectExists('模拟药物A（虚构演示·体重每次）');

    // 展开完整记录
    clickButtonByText('查看完整记录（输入、参数、计算过程） ▼');
    expectExists(/安全声明：/);

    // 删除（二次确认）
    clickButtonByText('删除');
    expectExists('删除这条历史记录？');
    clickButtonByText('确认删除');
    expectExists(/共 0 条记录/);
  });

  it('清空全部历史（二次确认）', () => {
    render(<App />);
    setSelectValue('f-template', 'demo-a');
    setInputValue('f-weight', '20');
    clickButtonByText('开始计算');
    navigateTo('历史');
    clickButtonByText('清空全部历史');
    expectExists('清空全部计算历史？');
    clickButtonByText('确认清空');
    expectExists(/共 0 条记录/);
  });

  it('模板管理页：模板卡片渲染、新增 / 删除自定义模板（含二次确认）', () => {
    render(<App />);
    navigateTo('药物模板');

    // 内置 8 个虚构演示模板 + 空白模板
    expectExists('模拟药物A（虚构演示·体重每次）');
    expectExists('模拟药物H（虚构演示·体表面积每次·口服液）');
    expectExists('空白模板（自行录入已核实参数）');
    expectExists('内置模板不可编辑');

    // 新增自定义模板
    clickButtonByText('新增自定义模板');
    expectExists('新增自定义模板');
    const nameInput = screen.getByPlaceholderText(
      '例如：XX 注射液（依据 XX 说明书 2025 版）',
    );
    fireEvent.change(nameInput, { target: { value: '测试模板（单元测试）' } });
    setInputValue('te-times', '2');
    setInputValue('te-dose', '10');
    clickButtonByText('保存模板');
    expectExists('测试模板（单元测试）');

    // 删除自定义模板（二次确认）
    const card = screen
      .queryAllByText(/测试模板（单元测试）/)
      .map((el) => el.closest('div.flex.flex-col'))
      .find(Boolean) as HTMLElement;
    fireEvent.click(within(card).getByRole('button', { name: '删除' }));
    expectExists('删除该自定义模板？');
    clickButtonByText('确认删除');
    expectMissing('测试模板（单元测试）');
  });

  it('模板页「用于计算」跳转：回到首页并自动填充模板参数', () => {
    render(<App />);
    navigateTo('药物模板');
    const card = screen
      .queryAllByText(/模拟药物B（虚构演示·体重每日）/)
      .map((el) => el.closest('div.flex.flex-col'))
      .find(Boolean) as HTMLElement;
    fireEvent.click(within(card).getByRole('button', { name: '用于计算' }));
    expectExists('剂量计算输入');
    // 模拟药物B：30 mg/kg/日 × 2 次/日
    expect((document.getElementById('f-dose') as HTMLInputElement).value).toBe(
      '30',
    );
    expect(
      (document.getElementById('f-times') as HTMLInputElement).value,
    ).toBe('2');
  });

  it('按体表面积计算演示：切换模式后身高必填 → BSA 显示 3 位小数', () => {
    render(<App />);
    setSelectValue('f-template', 'demo-a');
    setSelectValue('f-mode', 'bsa-per-dose');
    setInputValue('f-weight', '20');
    // 身高为 0 时禁止进行 BSA 计算（按钮可用，点击后被校验拦截）
    setInputValue('f-height', '0');
    clickButtonByText('开始计算');
    expectExists(/身高必须为大于 0/);

    setInputValue('f-height', '110');
    clickButtonByText('开始计算');
    expectExists(/0.782 m²/); // √(110×20/3600) = 0.781736…
    expectExists('6.254 mg/次'); // 0.781736 × 8
  });

  it('超限预警：超过单次 / 每日最大剂量时红色警告且结果不被截断', () => {
    render(<App />);
    setSelectValue('f-template', 'demo-a');
    setInputValue('f-weight', '60'); // 480 mg/次 > 400；1440 mg/日 > 1200
    clickButtonByText('开始计算');

    expectExists(
      '数学计算结果超过模板中人工设置的单次最大剂量，请停止使用该结果并交由医生或药师复核。',
    );
    expectExists(
      '数学计算结果超过模板中人工设置的每日最大剂量，请停止使用该结果并交由医生或药师复核。',
    );
    // 未自动修正（截断）为上限
    expectExists('480 mg/次');
    expectExists('1,440 mg/日');
    expectExists(/需要专业复核/);
  });

  it('未审核模板显著警告 + 来源缺失警告', () => {
    render(<App />);
    setSelectValue('f-template', 'demo-c'); // 未审核（虚构演示）
    setInputValue('f-weight', '20');
    setInputValue('f-height', '110');
    setInputValue('f-source', '');
    clickButtonByText('开始计算');
    expectExists(/剂量参数来源未填写/);
    expectExists(
      '当前模板处于「未审核」状态，数学计算结果仅供演示，必须由具备资质的医生或药师复核后方可参考。',
    );
  });

  it('重置按钮：清空表单与结果', () => {
    render(<App />);
    setSelectValue('f-template', 'demo-a');
    setInputValue('f-weight', '20');
    clickButtonByText('开始计算');
    expectExists('数学计算结果');
    clickButtonByText('重置');
    expectMissing('数学计算结果');
    expect((document.getElementById('f-weight') as HTMLInputElement).value).toBe(
      '',
    );
  });

  it('公式说明页：展示 Mosteller 与换算公式', () => {
    render(<App />);
    navigateTo('公式说明');
    expectExists('公式说明与安全声明');
    expectExists(/BSA（m²） = √\[/);
    expectExists(/0.45359237/);
    expectExists(/× 2.54/);
  });

  it('关于项目页：渲染技术架构与免责声明', () => {
    render(<App />);
    navigateTo('关于');
    expectExists('关于项目');
    expectExists('技术架构');
    expectExists(/MIT 协议开源/);
  });

  it('无效输入被拦截：负体重 / 非整数次数 / 零剂量不产生结果', () => {
    render(<App />);
    setSelectValue('f-template', 'demo-a');
    setInputValue('f-times', '1.5');
    setInputValue('f-weight', '-5');
    setInputValue('f-dose', '0');
    clickButtonByText('开始计算');
    expectMissing('数学计算结果');
    expectExists(/体重必须为大于 0/);
    expectExists(/正整数/);
    expectExists(/剂量参数必须为大于 0/);
  });

  it('隐私说明在历史页可见', () => {
    render(<App />);
    navigateTo('历史');
    expectExists(/所有记录仅保存在当前浏览器（localStorage）/);
  });
});

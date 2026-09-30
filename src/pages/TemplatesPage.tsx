import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DrugTemplate } from '../types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { TemplateEditor } from '../components/TemplateEditor';
import {
  IconEdit,
  IconLock,
  IconPlus,
  IconTrash,
} from '../components/Icons';
import { WarningBox } from '../components/WarningBox';
import { MODE_LABELS } from '../utils/calc';
import { formatDateTime, formatNumber } from '../utils/format';
import {
  importRealDrugLibrary,
  loadAllTemplates,
  loadUserTemplates,
  saveUserTemplates,
} from '../utils/storage';
import { REAL_LIBRARY_NOTE } from '../data/realDrugLibrary';

type TemplateFilter = 'all' | 'builtin' | 'real' | 'custom';

const isRealLibraryTemplate = (t: DrugTemplate) => t.id.startsWith('real-');

export function TemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<DrugTemplate[]>(() =>
    loadAllTemplates(),
  );
  const [editing, setEditing] = useState<DrugTemplate | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<DrugTemplate | null>(
    null,
  );
  const [filter, setFilter] = useState<TemplateFilter>('all');
  const [importMessage, setImportMessage] = useState<string>('');

  const builtinTemplates = templates.filter((t) => t.builtin);
  const realTemplates = templates.filter(
    (t) => !t.builtin && isRealLibraryTemplate(t),
  );
  const customTemplates = templates.filter(
    (t) => !t.builtin && !isRealLibraryTemplate(t),
  );

  const visibleTemplates = useMemo(() => {
    switch (filter) {
      case 'builtin':
        return builtinTemplates;
      case 'real':
        return realTemplates;
      case 'custom':
        return customTemplates;
      default:
        return templates;
    }
  }, [filter, templates, builtinTemplates, realTemplates, customTemplates]);

  const handleReimport = () => {
    const result = importRealDrugLibrary();
    setTemplates(loadAllTemplates());
    setImportMessage(
      `已刷新真实药物库为最新版本：共 ${result.imported} 个模板（重置为「未审核」，编辑过的条目需重新核对）。`,
    );
  };

  const handleSave = (saved: DrugTemplate) => {
    const current = loadUserTemplates();
    const idx = current.findIndex((t) => t.id === saved.id);
    const next =
      idx >= 0
        ? current.map((t) => (t.id === saved.id ? saved : t))
        : [...current, saved];
    saveUserTemplates(next);
    setTemplates([...templates.filter((t) => t.builtin), ...next]);
    setEditorOpen(false);
    setEditing(null);
  };

  const handleDelete = (t: DrugTemplate) => {
    const next = loadUserTemplates().filter((x) => x.id !== t.id);
    saveUserTemplates(next);
    setTemplates([...templates.filter((x) => x.builtin), ...next]);
    setPendingDelete(null);
  };

  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (t: DrugTemplate) => {
    setEditing(t);
    setEditorOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">演示药物模板管理</h1>
          <p className="mt-1 text-sm text-slate-500">
            内置 {builtinTemplates.filter((t) => t.id !== 'blank').length} 个虚构演示模板 +
            空白模板 + 真实药物库导入 {realTemplates.length} 个 + 自定义{' '}
            {customTemplates.length} 个
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleReimport}
            className="inline-flex items-center gap-2 rounded-lg border border-sky-300 bg-white px-4 py-2 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            重新导入真实药物库
          </button>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
          >
            <IconPlus className="h-4 w-4" />
            新增自定义模板
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor="tpl-filter"
          className="text-sm font-medium text-slate-700"
        >
          筛选：
        </label>
        <select
          id="tpl-filter"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          value={filter}
          onChange={(e) => setFilter(e.target.value as TemplateFilter)}
        >
          <option value="all">全部（{templates.length}）</option>
          <option value="builtin">内置虚构演示（{builtinTemplates.length}）</option>
          <option value="real">真实药物库导入（{realTemplates.length}）</option>
          <option value="custom">我的自定义（{customTemplates.length}）</option>
        </select>
        {importMessage && (
          <span className="text-xs font-medium text-sky-700">
            {importMessage}
          </span>
        )}
      </div>

      <WarningBox variant="warning" title="数据录入安全规则">
        <ul className="list-disc space-y-1 pl-5">
          <li>内置模板均为<b>虚构演示数据</b>，不可用于真实用药；</li>
          <li>
            真实药物数据只能由<b>管理员</b>依据最新权威药品说明书或临床规范人工录入，
            并填写<b>来源、版本/发布日期、审核状态</b>；
          </li>
          <li>本项目不存在「根据药物名称自动生成剂量」的逻辑；</li>
          <li>可参考的权威资料示例：药品说明书、临床诊疗指南、经审核的用药手册
            （需由管理员自行核实后录入）。</li>
        </ul>
      </WarningBox>

      {realTemplates.length > 0 && (
        <WarningBox variant="info" title={`真实药物导入库（${realTemplates.length} 个，摘自公开医学参考资料）`}>
          {REAL_LIBRARY_NOTE}导入条目摘自参考资料 A–D（儿科用药、外科用药、肿瘤用药类资料）原文，
          已脱敏处理，统一标记为「未审核」；
          请核对原文与最新说明书后，在卡片中改为「已审核」再使用。
        </WarningBox>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {visibleTemplates.map((t) => (
          <div
            key={t.id}
            className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900">{t.name}</h3>
              <div className="flex flex-shrink-0 flex-wrap gap-1.5">
                {t.builtin && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    内置
                  </span>
                )}
                {t.fictional && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                    虚构演示数据
                  </span>
                )}
                {t.id === 'blank' && (
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                    空白模板
                  </span>
                )}
                {isRealLibraryTemplate(t) && (
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                    真实数据·未审核
                  </span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    t.reviewStatus === '已审核'
                      ? 'bg-teal-50 text-teal-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {t.reviewStatus}
                </span>
              </div>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              {MODE_LABELS[t.calcMode]} · 更新于{' '}
              {formatDateTime(t.updatedAt)}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded bg-slate-50 px-2.5 py-1.5">
                <span className="text-slate-500">剂量参数：</span>
                <span className="font-num font-medium text-slate-900">
                  {t.dosePerUnit === null
                    ? '待人工录入'
                    : `${formatNumber(t.dosePerUnit, 4)} ${MODE_LABELS[t.calcMode].split('：')[1]}`}
                </span>
              </div>
              <div className="rounded bg-slate-50 px-2.5 py-1.5">
                <span className="text-slate-500">每日次数：</span>
                <span className="font-num font-medium text-slate-900">
                  {t.timesPerDay === null ? '待人工录入' : `${t.timesPerDay} 次/日`}
                </span>
              </div>
              <div className="rounded bg-slate-50 px-2.5 py-1.5">
                <span className="text-slate-500">单次上限：</span>
                <span className="font-num font-medium text-slate-900">
                  {t.maxSingleDose === null
                    ? '未设置'
                    : `${formatNumber(t.maxSingleDose, 2)} mg/次`}
                </span>
              </div>
              <div className="rounded bg-slate-50 px-2.5 py-1.5">
                <span className="text-slate-500">每日上限：</span>
                <span className="font-num font-medium text-slate-900">
                  {t.maxDailyDose === null
                    ? '未设置'
                    : `${formatNumber(t.maxDailyDose, 2)} mg/日`}
                </span>
              </div>
              <div className="col-span-2 rounded bg-slate-50 px-2.5 py-1.5">
                <span className="text-slate-500">制剂浓度：</span>
                <span className="font-num font-medium text-slate-900">
                  {t.concentration === null
                    ? '未提供'
                    : `${formatNumber(t.concentration, 2)} mg/mL`}
                </span>
              </div>
              <div className="col-span-2 rounded bg-slate-50 px-2.5 py-1.5">
                <span className="text-slate-500">数据来源：</span>
                <span className="font-medium text-slate-900">
                  {t.source || (
                    <span className="text-red-600">未填写</span>
                  )}
                </span>
                {t.sourceVersion && (
                  <span className="text-slate-500">（{t.sourceVersion}）</span>
                )}
              </div>
            </div>

            {t.notes && (
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                备注：{t.notes}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  navigate('/', { state: { templateId: t.id } })
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                用于计算
              </button>
              {t.builtin ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-400">
                  <IconLock className="h-3.5 w-3.5" />
                  内置模板不可编辑
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => openEdit(t)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                  >
                    <IconEdit className="h-3.5 w-3.5" />
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(t)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  >
                    <IconTrash className="h-3.5 w-3.5" />
                    删除
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <TemplateEditor
        open={editorOpen}
        template={editing}
        onSave={handleSave}
        onCancel={() => {
          setEditorOpen(false);
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="删除该自定义模板？"
        message={`将删除模板「${pendingDelete?.name ?? ''}」。删除后不可恢复，历史记录中已保存的快照不受影响。`}
        confirmText="确认删除"
        onConfirm={() => pendingDelete && handleDelete(pendingDelete)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

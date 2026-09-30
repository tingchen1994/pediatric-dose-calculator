import { useState } from 'react';
import type { HistoryEntry } from '../types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { IconClock, IconCopy, IconLock, IconTrash } from '../components/Icons';
import { WarningBox } from '../components/WarningBox';
import { MODE_LABELS } from '../utils/calc';
import { copyText } from '../utils/clipboard';
import { formatDateTime, formatNumber } from '../utils/format';
import {
  FICTIONAL_NOTE,
  getSafetyFlags,
} from '../utils/safety';
import { buildResultText } from '../utils/resultText';
import {
  clearHistoryStorage,
  loadHistory,
  saveHistory,
} from '../utils/storage';

export function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => loadHistory());
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [pendingDelete, setPendingDelete] = useState<HistoryEntry | null>(null);
  const [pendingClear, setPendingClear] = useState(false);

  const handleDelete = (entry: HistoryEntry) => {
    const next = entries.filter((e) => e.id !== entry.id);
    setEntries(next);
    saveHistory(next);
    setPendingDelete(null);
  };

  const handleClearAll = () => {
    setEntries([]);
    clearHistoryStorage();
    setPendingClear(false);
  };

  const handleCopy = async (entry: HistoryEntry) => {
    await copyText(buildResultText(entry, entry.createdAt));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">计算历史</h1>
          <p className="mt-1 text-sm text-slate-500">
            共 {entries.length} 条记录 · 按时间倒序
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPendingClear(true)}
          disabled={entries.length === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
        >
          <IconTrash className="h-4 w-4" />
          清空全部历史
        </button>
      </div>

      <WarningBox variant="info" title="隐私说明">
        <span className="inline-flex items-center gap-1.5">
          <IconLock className="h-4 w-4" />
          所有记录仅保存在当前浏览器（localStorage），不上传服务器，
          不包含姓名、病历号、联系方式等个人信息。清除浏览器数据将同步删除。
        </span>
      </WarningBox>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
          <IconClock className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-3 text-sm font-medium text-slate-600">
            暂无计算历史
          </p>
          <p className="mt-1 text-xs text-slate-500">
            在「计算」页完成一次计算后，记录会自动保存在这里（仅限本浏览器）。
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => {
            const flags = getSafetyFlags(entry);
            const isOpen = !!expanded[entry.id];
            return (
              <li
                key={entry.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          {entry.templateName}
                        </h3>
                        {entry.fictional && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                            {FICTIONAL_NOTE}
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            entry.reviewStatus === '已审核'
                              ? 'bg-teal-50 text-teal-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {entry.reviewStatus}
                        </span>
                        {(entry.singleExceeded || entry.dailyExceeded) && (
                          <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                            ⚠ 超限 · 待复核
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDateTime(entry.createdAt)} ·{' '}
                        {MODE_LABELS[entry.calcMode]} ·{' '}
                        {formatNumber(entry.weightKg, 2)} kg
                        {entry.bsa !== null
                          ? ` · BSA ${formatNumber(entry.bsa, 3, 3)} m²`
                          : ''}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(entry)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                      >
                        <IconCopy className="h-3.5 w-3.5" />
                        复制
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(entry)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                        删除
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-xs text-slate-500">单次剂量</p>
                      <p className="font-num text-sm font-semibold text-slate-900">
                        {formatNumber(entry.singleDose, 3)} mg/次
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-xs text-slate-500">每日总量</p>
                      <p className="font-num text-sm font-semibold text-slate-900">
                        {formatNumber(entry.dailyDose, 3)} mg/日
                      </p>
                    </div>
                    {entry.volumePerDose !== null && (
                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-xs text-slate-500">每次体积</p>
                        <p className="font-num text-sm font-semibold text-slate-900">
                          {formatNumber(entry.volumePerDose, 3)} mL/次
                        </p>
                      </div>
                    )}
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-xs text-slate-500">数据来源</p>
                      <p className="truncate text-sm font-medium text-slate-900">
                        {entry.source || (
                          <span className="text-red-600">未填写</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((prev) => ({
                        ...prev,
                        [entry.id]: !prev[entry.id],
                      }))
                    }
                    className="mt-3 text-xs font-medium text-teal-700 hover:text-teal-800 focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    {isOpen ? '收起完整记录 ▲' : '查看完整记录（输入、参数、计算过程） ▼'}
                  </button>
                </div>

                {isOpen && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                    <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-white p-3 font-num text-xs leading-relaxed text-slate-700">
                      {buildResultText(entry, entry.createdAt)}
                    </pre>
                    <p className="mt-2 text-xs text-slate-500">
                      快照说明：历史记录保存计算时的输入、单位、计算模式、结果、公式、来源与时间；
                      复制内容包含完整安全声明。
                      {flags.needsReview && '（该记录状态：需要专业复核）'}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="删除这条历史记录？"
        message="删除后不可恢复。该操作只影响当前浏览器中的记录，不会影响其他任何数据。"
        confirmText="确认删除"
        onConfirm={() => pendingDelete && handleDelete(pendingDelete)}
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmDialog
        open={pendingClear}
        title="清空全部计算历史？"
        message="将删除当前浏览器中保存的全部计算历史（不可恢复）。模板与表单数据不受影响。"
        confirmText="确认清空"
        onConfirm={handleClearAll}
        onCancel={() => setPendingClear(false)}
      />
    </div>
  );
}

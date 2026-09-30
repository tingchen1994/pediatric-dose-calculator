/**
 * 本地存储模块（localStorage）。
 *
 * 隐私设计：
 * - 计算历史与用户自定义模板仅保存在当前浏览器，不上传任何数据到服务器；
 * - 不保存姓名、病历号、联系方式等个人信息；
 * - 存储失败（隐私模式等）时降级为内存模式，不影响页面使用。
 */

import type { DrugTemplate, HistoryEntry } from '../types';
import { BUILTIN_TEMPLATES } from '../data/demoTemplates';
import { REAL_DRUG_LIBRARY, type RealDrugSeed } from '../data/realDrugLibrary';

const TEMPLATE_KEY = 'pdc.userTemplates.v1';
const HISTORY_KEY = 'pdc.history.v1';
const REAL_LIBRARY_FLAG = 'pdc.realLibraryImported.v1';
/** 历史记录上限，超出后只保留最新记录 */
const HISTORY_LIMIT = 200;

const memoryStore = new Map<string, string>();

/** 会话内是否已检查过真实药物库导入（避免每次读取都写存储） */
let librarySeedChecked = false;

function readJSON<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === 'undefined') {
      const mem = memoryStore.get(key);
      return mem ? (JSON.parse(mem) as T) : fallback;
    }
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): boolean {
  try {
    const text = JSON.stringify(value);
    if (typeof localStorage === 'undefined') {
      memoryStore.set(key, text);
      return true;
    }
    localStorage.setItem(key, text);
    return true;
  } catch {
    return false;
  }
}

function isTemplate(t: unknown): t is DrugTemplate {
  return (
    typeof t === 'object' &&
    t !== null &&
    typeof (t as DrugTemplate).id === 'string' &&
    typeof (t as DrugTemplate).name === 'string'
  );
}

/** 读取用户自定义模板（不含内置虚构演示模板） */
export function loadUserTemplates(): DrugTemplate[] {
  const list = readJSON<unknown[]>(TEMPLATE_KEY, []);
  if (!Array.isArray(list)) return [];
  return list.filter(isTemplate);
}

/** 保存用户自定义模板 */
export function saveUserTemplates(templates: DrugTemplate[]): boolean {
  return writeJSON(TEMPLATE_KEY, templates);
}

/** 全部可用模板 = 内置虚构演示模板 + 空白模板 + 用户自定义模板（含导入的真实药物库） */
export function loadAllTemplates(): DrugTemplate[] {
  // 首次加载时自动导入真实药物库（一次性，按浏览器 localStorage 标记）
  if (!librarySeedChecked) {
    librarySeedChecked = true;
    try {
      if (!isRealLibraryImported()) {
        importRealDrugLibrary();
      }
    } catch {
      // 存储异常时忽略，不影响内置模板使用
    }
  }
  return [...BUILTIN_TEMPLATES, ...loadUserTemplates()];
}

/** 判断真实药物库是否已导入当前浏览器 */
export function isRealLibraryImported(): boolean {
  return readJSON<unknown>(REAL_LIBRARY_FLAG, null) !== null;
}

/** 将摘录的真实药物库导入为「未审核」的用户自定义模板（幂等：按 id 跳过已存在的） */
export function importRealDrugLibrary(): {
  imported: number;
  skipped: number;
  total: number;
} {
  const current = loadUserTemplates();
  const existingIds = new Set(current.map((t) => t.id));
  const now = new Date().toISOString();
  let imported = 0;
  for (const seed of REAL_DRUG_LIBRARY) {
    if (existingIds.has(seed.id)) continue;
    current.push(seedToTemplate(seed, now));
    imported += 1;
  }
  saveUserTemplates(current);
  writeJSON(REAL_LIBRARY_FLAG, { importedAt: now, version: 1 });
  return {
    imported,
    skipped: REAL_DRUG_LIBRARY.length - imported,
    total: REAL_DRUG_LIBRARY.length,
  };
}

function seedToTemplate(seed: RealDrugSeed, now: string): DrugTemplate {
  return {
    id: seed.id,
    name: seed.name,
    builtin: false,
    // 摘录录入的真实药物不标记为虚构演示数据，但一律为「未审核」状态
    fictional: false,
    calcMode: seed.calcMode,
    dosePerUnit: seed.dosePerUnit,
    timesPerDay: seed.timesPerDay,
    maxSingleDose: seed.maxSingleDose,
    maxDailyDose: seed.maxDailyDose,
    concentration: seed.concentration,
    source: seed.source,
    sourceVersion: seed.sourceVersion,
    reviewStatus: '未审核',
    notes: seed.notes,
    createdAt: now,
    updatedAt: now,
  };
}

function isHistoryEntry(e: unknown): e is HistoryEntry {
  return (
    typeof e === 'object' &&
    e !== null &&
    typeof (e as HistoryEntry).id === 'string' &&
    typeof (e as HistoryEntry).createdAt === 'string'
  );
}

/** 读取计算历史（按时间倒序） */
export function loadHistory(): HistoryEntry[] {
  const list = readJSON<unknown[]>(HISTORY_KEY, []);
  if (!Array.isArray(list)) return [];
  return list
    .filter(isHistoryEntry)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** 保存计算历史（ newest first，自动限制条数） */
export function saveHistory(entries: HistoryEntry[]): boolean {
  const capped = entries.slice(0, HISTORY_LIMIT);
  return writeJSON(HISTORY_KEY, capped);
}

/** 清空全部计算历史 */
export function clearHistoryStorage(): boolean {
  return writeJSON(HISTORY_KEY, []);
}

export function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

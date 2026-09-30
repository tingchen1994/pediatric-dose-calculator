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
/** 真实药物库版本号：库内容升级（如脱敏）时递增，浏览器中旧版本条目会被自动刷新 */
const REAL_LIBRARY_VERSION = 2;
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
  // 首次加载、或库版本升级时自动导入/刷新真实药物库（每会话一次）
  if (!librarySeedChecked) {
    librarySeedChecked = true;
    try {
      const flag = readJSON<{ version?: number } | null>(REAL_LIBRARY_FLAG, null);
      if (!flag || flag.version !== REAL_LIBRARY_VERSION) {
        importRealDrugLibrary();
      }
    } catch {
      // 存储异常时忽略，不影响内置模板使用
    }
  }
  return [...BUILTIN_TEMPLATES, ...loadUserTemplates()];
}

/** 判断真实药物库是否已导入当前浏览器（且为最新版本） */
export function isRealLibraryImported(): boolean {
  const flag = readJSON<{ version?: number } | null>(REAL_LIBRARY_FLAG, null);
  return flag !== null && flag.version === REAL_LIBRARY_VERSION;
}

/**
 * 将摘录的真实药物库导入为「未审核」的用户自定义模板。
 * 幂等：先移除所有 real-* 种子条目再重新导入，保证浏览器中的条目与库版本一致。
 * 注意：重导入会覆盖用户对 real-* 条目的手工修改（「已审核」状态会重置为「未审核」）。
 */
export function importRealDrugLibrary(): {
  imported: number;
  skipped: number;
  total: number;
} {
  const current = loadUserTemplates().filter((t) => !t.id.startsWith('real-'));
  const now = new Date().toISOString();
  for (const seed of REAL_DRUG_LIBRARY) {
    current.push(seedToTemplate(seed, now));
  }
  saveUserTemplates(current);
  writeJSON(REAL_LIBRARY_FLAG, { importedAt: now, version: REAL_LIBRARY_VERSION });
  return {
    imported: REAL_DRUG_LIBRARY.length,
    skipped: 0,
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

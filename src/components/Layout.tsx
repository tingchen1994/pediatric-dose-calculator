import { Link, NavLink, Outlet } from 'react-router-dom';
import { SafetyBanner } from './SafetyBanner';
import { SAFETY_DISCLAIMER } from '../utils/safety';

const NAV_ITEMS = [
  { to: '/', label: '计算' },
  { to: '/history', label: '历史' },
  { to: '/templates', label: '药物模板' },
  { to: '/formula', label: '公式说明' },
  { to: '/about', label: '关于' },
];

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="no-print sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex h-14 items-center gap-3">
            <Link to="/" className="flex flex-shrink-0 items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              <span className="text-base font-bold text-slate-900">
                小儿剂量助手
              </span>
              <span className="hidden text-xs text-slate-500 sm:inline">
                Pediatric Dose Calculator
              </span>
            </Link>
            <nav
              className="flex flex-1 items-center gap-1 overflow-x-auto"
              aria-label="主导航"
            >
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-teal-50 text-teal-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <SafetyBanner />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 print-full">
        <Outlet />
      </main>

      <footer className="no-print border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl space-y-2 px-4 py-6 text-xs leading-relaxed text-slate-500">
          <p className="flex items-center gap-1.5 font-medium text-slate-600">
            隐私说明：所有计算记录与自定义模板仅保存在当前浏览器（localStorage），
            不上传服务器，不收集姓名、病历号或联系方式。
          </p>
          <p>{SAFETY_DISCLAIMER}</p>
          <p>
            教学 / 比赛 Demo · 非医疗器械软件 · 仅供学习与剂量计算复核演示 ·
            内置模板均为虚构演示数据
          </p>
        </div>
      </footer>
    </div>
  );
}

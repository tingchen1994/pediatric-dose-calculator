import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    setupFiles: ['src/tests/setup.ts'],
    include: ['src/tests/**/*.test.{ts,tsx}'],
    // 单进程运行：避免 Windows 多 worker 并写临时缓存时偶发 EPERM
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});

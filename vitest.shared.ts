import { defineProject } from 'vitest/config';

const isCI = process.env.CI === 'true';

export default defineProject({
  build: {
    target: 'esnext',
  },
  cacheDir: '.vite',
  esbuild: {
    supported: {
      decorators: false,
      'top-level-await': true,
    },
  },
  test: {
    browser: {
      api: {
        port: 9876,
      },
      ui: !isCI,
      screenshotFailures: isCI,
      provider: 'playwright',
      enabled: true,
      name: 'chromium',
      headless: true,
      providerOptions: {
        launch: {
          executablePath: process.env.CHROME_BIN,
        },
      },
    },
  },
});

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="vitest/node" />
import { defineConfig } from 'vitest/config';

const isCI = process.env.CI === 'true';

export default defineConfig({
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
    includeTaskLocation: !isCI,
    browser: {
      api: {
        port: 9876,
      },
      ui: !isCI,
      screenshotFailures: isCI,
      provider: 'playwright',
      name: 'chromium',
      enabled: true,
      headless: true,
      instances: [
        {
          browser: 'chromium',
          launch: {
            executablePath: process.env.CHROME_BIN,
          },
        },
      ],
    },
  },
});

// eslint-disable-next-line import/no-unassigned-import
import 'vitest/node';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { defineConfig } from 'vitest/config';

const isCI = process.env.CI === 'true';

const cwd = pathToFileURL(`${process.cwd()}/`);

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
    coverage: {
      all: true,
      provider: 'v8',
      reportsDirectory: fileURLToPath(new URL('.coverage/', cwd)),
      clean: true,
      reporter: isCI ? ['lcov'] : ['html'],
    },
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

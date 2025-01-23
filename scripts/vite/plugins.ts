import { readFile } from 'node:fs/promises';
import MagicString from 'magic-string';
import type { Plugin } from 'vitest/config';

export type PluginOptions = Readonly<{
  root: URL;
}>;

export type LoadRegisterOptions = PluginOptions;

// This plugin adds "__REGISTER__()" function definition everywhere where it finds
// the call for that function. It is necessary for a correct code for tests.
export function loadRegisterJs({ root }: LoadRegisterOptions): Plugin {
  return {
    enforce: 'pre',
    name: 'vite-hilla-register',
    async transform(code) {
      if (code.includes('__REGISTER__()') && !code.includes('function __REGISTER__')) {
        const registerCode = await readFile(new URL('scripts/register.js', root), 'utf8').then((c) =>
          c.replace('export', ''),
        );

        const _code = new MagicString(code);
        _code.prepend(registerCode);

        return {
          code: _code.toString(),
          map: _code.generateMap(),
        };
      }

      return null;
    },
  };
}

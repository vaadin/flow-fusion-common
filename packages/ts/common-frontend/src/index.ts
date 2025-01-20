import connectionIndicatorPart from './ConnectionIndicator.js';
import connectionStatePart from './ConnectionState.js';
import consoleErrorsPart from './Vaadin/ConsoleErrors.js';
import developmentModePart from './Vaadin/developmentMode.js';
import devToolsPart from './Vaadin/devTools.js';
import devToolsPluginPart from './Vaadin/devToolsPlugin.js';
import typescriptPart from './Vaadin/TypeScript.js';

export {
  ConnectionState,
  type ConnectionStateChangeListener,
  ConnectionStateStore,
  isLocalhost,
} from './ConnectionState.js';
export { ConnectionIndicator } from './ConnectionIndicator.js';

window.Vaadin = {
  ...connectionIndicatorPart,
  ...connectionStatePart,
  ...consoleErrorsPart,
  ...developmentModePart,
  ...devToolsPart,
  ...devToolsPluginPart,
  ...typescriptPart,
};

// @ts-expect-error: esbuild injection
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
__REGISTER__();

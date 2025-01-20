import type { Writable } from 'type-fest';

declare global {
  interface VaadinFlow {
    initApplication?(appId: string, config: Record<string, unknown>): Record<string, unknown>;
    tryCatchWrapper<F extends (...args: readonly unknown[]) => unknown>(original: F, component: string): F;
  }
}

export class FlowUiInitializationError extends Error {}

const elm = document.head.querySelector('base');
const baseRegex = new RegExp(
  `^${
    // IE11 does not support document.baseURI
    ((document.baseURI || elm?.href) ?? '/').replace(/^https?:\/\/[^/]+/iu, '')
  }`,
  'u',
);

async function initFlowUi(): Promise<AppInitPayload> {
  // appConfig was sent in the index.html request
  const { initial } = Vaadin.TypeScript;
  if (initial) {
    (Vaadin.TypeScript as Writable<Vaadin['TypeScript']>).initial = undefined;
    return initial;
  }

  const flowRoutePath = decodeURIComponent(location.pathname).replace(baseRegex, '');
  const flowRouteQuery = decodeURIComponent(location.search).slice(1);
  const response = await fetch(
    `?v-r=init&location=${encodeURIComponent(flowRoutePath)}&query=${encodeURIComponent(flowRouteQuery)}`,
  );

  if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
    return response.json();
  }

  throw new FlowUiInitializationError(
    `Invalid server response when initializing Flow UI.
      ${response.status}
      ${await response.text()}`,
  );
}

const { appConfig } = await initFlowUi();

// For devMode reset app config and restart widgetset as client
// is up and running after hrm update.
function getConfig<T extends keyof AppConfig>(name: T) {
  return appConfig[name];
}

type App = Readonly<{
  getConfig<T extends keyof AppConfig>(name: T): AppConfig[T];
}>;

/* This is a copy of the regular `BootstrapHandler.js` in the flow-server
   module, but with the following modifications:
   - The main function is exported as an ES module for lazy initialization.
   - Application configuration is passed as a parameter instead of using
     replacement placeholders as in the regular bootstrapping.
   - It reuses `Vaadin.Flow.clients` if exists.
   - Fixed lint errors.
 */
export function init(appInitResponse) {
  const apps: Record<string, App | undefined> = {};
  const widgetsets = {};

  let log: typeof console.log;
  if (typeof window.console === 'undefined' || !/[&?]debug(&|$)/u.exec(window.location.search)) {
    // If no console.log present, just use a no-op
    log = () => {};
  } else if (typeof window.console.log === 'function') {
    // If it's a function, use it with apply
    // eslint-disable-next-line no-console
    ({ log } = console);
  }

  window.Vaadin.Flow.initApplication = (appId, config) => {
    const testbenchId = appId.replace(/-\d+$/u, '');

    if (apps[appId]) {
      if (window.Vaadin.Flow.clients[testbenchId].initializing) {
        throw new Error(`Application ${appId} is already being initialized`);
      }
      if (isInitializedInDom(appId)) {
        if (appInitResponse.appConfig.productionMode) {
          throw new Error(`Application ${appId} already initialized`);
        }

        // Remove old contents for Flow
        const appDiv = document.getElementById(appId);
        for (let i = 0; i < appDiv.childElementCount; i++) {
          appDiv.childNodes[i].remove();
        }

        // For devMode reset app config and restart widgetset as client
        // is up and running after hrm update.
        const getConfig = function (name) {
          return config[name];
        };

        /* Export public data */
        const app = {
          getConfig,
        };
        apps[appId] = app;

        if (widgetsets.client.callback) {
          log('Starting from bootstrap', appId);
          widgetsets.client.callback(appId);
        } else {
          log('Setting pending startup', appId);
          widgetsets.client.pendingApps.push(appId);
        }
        return apps[appId];
      }
    }

    log('init application', appId, config);

    window.Vaadin.Flow.clients[testbenchId] = {
      isActive() {
        return true;
      },
      initializing: true,
      productionMode: mode,
    };

    const getConfig = function (name) {
      const value = config[name];
      return value;
    };

    /* Export public data */
    const app = {
      getConfig,
    };
    apps[appId] = app;

    if (!window.name) {
      window.name = `${appId}-${Math.random()}`;
    }

    const widgetset = 'client';
    widgetsets[widgetset] = {
      pendingApps: [],
    };
    if (widgetsets[widgetset].callback) {
      log('Starting from bootstrap', appId);
      widgetsets[widgetset].callback(appId);
    } else {
      log('Setting pending startup', appId);
      widgetsets[widgetset].pendingApps.push(appId);
    }

    return app;
  };
  window.Vaadin.Flow.getAppIds = function () {
    const ids = [];
    for (const id in apps) {
      if (Object.hasOwn(apps, id)) {
        ids.push(id);
      }
    }
    return ids;
  };
  window.Vaadin.Flow.getApp = function (appId) {
    return apps[appId];
  };
  window.Vaadin.Flow.registerWidgetset = function (widgetset, callback) {
    log('Widgetset registered', widgetset);
    const ws = widgetsets[widgetset];
    if (ws?.pendingApps) {
      ws.callback = callback;
      for (let i = 0; i < ws.pendingApps.length; i++) {
        const appId = ws.pendingApps[i];
        log('Starting from register widgetset', appId);
        callback(appId);
      }
      ws.pendingApps = null;
    }
  };
  window.Vaadin.Flow.getBrowserDetailsParameters = function () {
    const params = {};

    /* Screen height and width */
    params['v-sh'] = window.screen.height;
    params['v-sw'] = window.screen.width;
    /* Browser window dimensions */
    params['v-wh'] = window.innerHeight;
    params['v-ww'] = window.innerWidth;
    /* Body element dimensions */
    params['v-bh'] = document.body.clientHeight;
    params['v-bw'] = document.body.clientWidth;

    /* Current time */
    const date = new Date();
    params['v-curdate'] = date.getTime();

    /* Current timezone offset (including DST shift) */
    const tzo1 = date.getTimezoneOffset();

    /* Compare the current tz offset with the first offset from the end
         of the year that differs --- if less that, we are in DST, otherwise
         we are in normal time */
    let dstDiff = 0;
    let rawTzo = tzo1;
    for (let m = 12; m > 0; m--) {
      date.setUTCMonth(m);
      const tzo2 = date.getTimezoneOffset();
      if (tzo1 != tzo2) {
        dstDiff = tzo1 > tzo2 ? tzo1 - tzo2 : tzo2 - tzo1;
        rawTzo = tzo1 > tzo2 ? tzo1 : tzo2;
        break;
      }
    }

    /* Time zone offset */
    params['v-tzo'] = tzo1;

    /* DST difference */
    params['v-dstd'] = dstDiff;

    /* Time zone offset without DST */
    params['v-rtzo'] = rawTzo;

    /* DST in effect? */
    params['v-dston'] = tzo1 != rawTzo;

    /* Time zone id (if available) */
    try {
      params['v-tzid'] = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (err) {
      params['v-tzid'] = '';
    }

    /* Window name */
    if (window.name) {
      params['v-wn'] = window.name;
    }

    /* Detect touch device support */
    let supportsTouch = false;
    try {
      document.createEvent('TouchEvent');
      supportsTouch = true;
    } catch (e) {
      /* Chrome and IE10 touch detection */
      supportsTouch = 'ontouchstart' in window || typeof navigator.msMaxTouchPoints !== 'undefined';
    }
    params['v-td'] = supportsTouch;

    /* Device Pixel Ratio */
    params['v-pr'] = window.devicePixelRatio;

    if (navigator.platform) {
      params['v-np'] = navigator.platform;
    }

    /* Stringify each value (they are parsed on the server side) */
    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (typeof value !== 'undefined') {
        params[key] = value.toString();
      }
    });
    return params;
  };

  log('Flow bootstrap loaded');
  if (appInitResponse.appConfig.productionMode && typeof window.__gwtStatsEvent !== 'function') {
    window.Vaadin.Flow.gwtStatsEvents = [];
    window.__gwtStatsEvent = function (event) {
      window.Vaadin.Flow.gwtStatsEvents.push(event);
      return true;
    };
  }
  const config = appInitResponse.appConfig;
  var mode = appInitResponse.appConfig.productionMode;
  window.Vaadin.Flow.initApplication(config.appId, config);
}

export { init };

const apps: Record<string, App | undefined> = {};

function isInitializedInDom(appId: string) {
  return Array.from(document.getElementById(appId)?.children ?? [], (child) => child.classList).some((list) =>
    list.contains('v-app-loading'),
  );
}

export default {
  /**
   * Needed for wrapping custom javascript functionality in the components (i.e. connectors)
   */
  tryCatchWrapper<F extends (...args: readonly unknown[]) => unknown>(original: F, component: string): F {
    return function wrapped(this: ThisType<F>, ...args: Parameters<F>) {
      try {
        return original.apply(this, args);
      } catch (error: unknown) {
        console.error(
          `There seems to be an error in ${component}:
${error instanceof Error ? error.message : ''}
Please submit an issue to https://github.com/vaadin/flow-components/issues/new/choose`,
        );
        return undefined;
      }
    } as F;
  },
  initApplication(appId, config) {
    const { clients } = Vaadin.Flow;

    const testbenchId = appId.replace(/-\d+$/u, '');

    if (apps[appId]) {
      if (clients[testbenchId].initializing) {
        throw new Error(`Application ${appId} is already being initialized`);
      }
      if (isInitializedInDom(appId)) {
        if (appConfig.productionMode) {
          throw new Error(`Application ${appId} already initialized`);
        }

        // Remove old contents for Flow
        for (const child of document.getElementById(appId)?.children ?? []) {
          child.remove();
        }

        /* Export public data */
        const app = {
          getConfig,
        };
        apps[appId] = app;

        if (widgetsets.client.callback) {
          log('Starting from bootstrap', appId);
          widgetsets.client.callback(appId);
        } else {
          log('Setting pending startup', appId);
          widgetsets.client.pendingApps.push(appId);
        }
        return apps[appId];
      }
    }

    log('init application', appId, appConfig);

    window.Vaadin.Flow.clients[testbenchId] = {
      isActive() {
        return true;
      },
      initializing: true,
      productionMode: appConfig.productionMode,
    };

    const getConfig = function (name) {
      const value = appConfig[name];
      return value;
    };

    /* Export public data */
    const app = {
      getConfig,
    };
    apps[appId] = app;

    if (!window.name) {
      window.name = `${appId}-${Math.random()}`;
    }

    const widgetset = 'client';
    widgetsets[widgetset] = {
      pendingApps: [],
    };
    if (widgetsets[widgetset].callback) {
      log('Starting from bootstrap', appId);
      widgetsets[widgetset].callback(appId);
    } else {
      log('Setting pending startup', appId);
      widgetsets[widgetset].pendingApps.push(appId);
    }

    return app;
  },
} satisfies Pick<VaadinFlow, 'tryCatchWrapper' | 'initApplication'>;

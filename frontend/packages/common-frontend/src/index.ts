export * from './ConnectionState.js';
export * from './ConnectionIndicator.js';

const $wnd = window as any;
$wnd.Vaadin ??= {};
$wnd.Vaadin.registrations ??= [];
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
$wnd.Vaadin.registrations.push({
  is: '@vaadin/common-frontend',
  version: /* updated-by-script */ '0.0.18',
});

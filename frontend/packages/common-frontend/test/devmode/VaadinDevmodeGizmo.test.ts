import { assert } from '@open-wc/testing';

import { VaadinDevmodeGizmo } from '../../src/devmode/VaadinDevmodeGizmo';

describe('VaadinDevmodeGizmo', () => {
  it('should connect to port-hostname.gitpod.io with Spring Boot Devtools', () => {
    const gizmo = document.createElement('vaadin-devmode-gizmo') as VaadinDevmodeGizmo;
    gizmo.setAttribute('url', '');
    gizmo.setAttribute('backend', 'SPRING_BOOT_DEVTOOLS');
    gizmo.setAttribute('springBootLiveReloadPort', '35729');
    let location = {
      protocol: 'https',
      hostname: 'abc-12345678-1234-1234-1234-1234567890ab.ws-eu01.gitpod.io',
    };
    assert.equal(
      gizmo.getSpringBootWebSocketUrl(location),
      'ws://35729-12345678-1234-1234-1234-1234567890ab.ws-eu01.gitpod.io'
    );
  });

  it('should use base URI', () => {
    const gizmo = document.createElement('vaadin-devmode-gizmo') as VaadinDevmodeGizmo;
    gizmo.setAttribute('url', 'http://localhost:8080/context/vaadinServlet');
    gizmo.setAttribute('backend', 'HOTSWAP_AGENT');

    assert.equal(gizmo.getDedicatedWebSocketUrl(), 'ws://localhost:8080/context/vaadinServlet?v-r=push&debug_window');
  });
});

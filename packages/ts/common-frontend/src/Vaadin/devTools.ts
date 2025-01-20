/* eslint-disable @typescript-eslint/unbound-method */
declare global {
  interface VaadinLicenseChecker {
    maybeCheck(productInfo: unknown): void;
  }

  interface VaadinDevTools {
    createdCvdlElements: readonly HTMLElement[];
  }

  interface Vaadin {
    VaadinLicenseChecker: VaadinLicenseChecker;
    devTools: VaadinDevTools;
    originalCustomElementDefineFn: typeof customElements.define;
  }
}

export interface CustomElement {
  connectedCallback?(): void;
  disconnectedCallback?(): void;
  adoptedCallback?(): void;
  attributeChangedCallback?(name: string, oldValue: string | null, newValue: string | null): void;
}

export interface CustomElementConstructorWithPrototype extends CustomElementConstructor {
  prototype: CustomElement;
}

const originalCustomElementDefineFn = customElements.define;

const createdCvdlElements: HTMLElement[] = [];

Object.defineProperty(customElements, 'define', {
  configurable: true,
  value<T extends CustomElementConstructorWithPrototype>(
    name: string,
    constructor: T,
    options?: ElementDefinitionOptions,
  ) {
    if ('cvdlName' in constructor && constructor.cvdlName && 'version' in constructor && constructor.version) {
      const { connectedCallback } = constructor.prototype;

      Object.defineProperty(constructor.prototype, 'connectedCallback', {
        configurable: true,
        value(this: HTMLElement) {
          createdCvdlElements.push(this);

          if (connectedCallback) {
            connectedCallback.call(this);
          }
        },
      });
    }

    originalCustomElementDefineFn.call(customElements, name, constructor, options);
  },
});

export default {
  VaadinLicenseChecker: {
    maybeCheck(_productInfo: unknown) {},
  },
  devTools: {
    createdCvdlElements,
  },
  originalCustomElementDefineFn,
} satisfies Pick<Vaadin, 'VaadinLicenseChecker' | 'devTools' | 'originalCustomElementDefineFn'>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface,@typescript-eslint/no-empty-object-type
  interface Vaadin {}

  const Vaadin: Vaadin;

  interface Window {
    Vaadin: Vaadin;
  }
}

export type WritableArray<T> = T extends ReadonlyArray<infer U> ? U[] : T;

declare global {
  interface Vaadin {
    developmentMode: boolean;
  }
}

export default {
  developmentMode: false,
} satisfies Pick<Vaadin, 'developmentMode'>;

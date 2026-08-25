export interface LoadablePage {
  expectPageLoaded(): Promise<void>;
}

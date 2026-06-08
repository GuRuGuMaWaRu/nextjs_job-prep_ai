import "@testing-library/jest-dom";

if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }),
  });
}

if (
  typeof HTMLElement !== "undefined" &&
  typeof HTMLElement.prototype.hasPointerCapture !== "function"
) {
  Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", {
    writable: true,
    value: () => false,
  });
}

if (
  typeof Element !== "undefined" &&
  typeof Element.prototype.scrollIntoView !== "function"
) {
  Object.defineProperty(Element.prototype, "scrollIntoView", {
    writable: true,
    value: jest.fn(),
  });
}

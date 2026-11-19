// Evaluates src/dashboard-header.js (a classic script, bundled as is by scripts/build.mjs) in a sandbox with minimal
// DOM stand-ins and returns its test hooks (window.dashboardHeader). No dependency, no browser.
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../src/dashboard-header.js", import.meta.url), "utf8");

export const load = () => {
  const registry = new Map();
  class HTMLElement {
    attachShadow() {
      this.shadowRoot = { innerHTML: "", querySelector: () => null, querySelectorAll: () => [] };
      return this.shadowRoot;
    }
  }
  const sandbox = {
    HTMLElement,
    CustomEvent: class {},
    MutationObserver: class {
      observe() {}
      disconnect() {}
    },
    console: { info() {} },
    customElements: { get: (t) => registry.get(t), define: (t, c) => registry.set(t, c) },
    document: { querySelector: () => null, visibilityState: "hidden" },
    location: { pathname: "/dashboard-home/0", search: "" },
    history: { pushState() {} },
    requestAnimationFrame: () => 0,
    setInterval: () => 0,
    addEventListener() {},
    scrollY: 0,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return { ...sandbox.dashboardHeader, Banner: registry.get("dashboard-header-banner") };
};

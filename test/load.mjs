// Evaluates the bundled card source (test/source.mjs) (a classic script, bundled as is by scripts/build.mjs) in a sandbox with minimal
// DOM stand-ins and returns its test hooks (window.dashboardHeader). No dependency, no browser.
import vm from "node:vm";
import { source } from "./source.mjs";


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
    Event: class {
      constructor(type) {
        this.type = type;
      }
    },
    dispatched: [],
    dispatchEvent(ev) {
      sandbox.dispatched.push(ev.type);
    },
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
  return { ...sandbox.dashboardHeader, dispatched: sandbox.dispatched, Banner: registry.get("dashboard-header-banner") };
};

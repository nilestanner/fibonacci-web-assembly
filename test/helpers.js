// Helpers for exercising the browser-global scripts (ui.controller.js, main.javascript.js,
// main.assembly.js) and the prebuilt WASM module in plain Node, without a browser or any npm dependencies.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const wasmPath = path.join(root, 'out', 'main.wasm');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

// Minimal stand-in for the few DOM elements the scripts touch.
const makeDocument = (values = {}) => {
  const elements = {
    'max-fib': { value: values.maxFib !== undefined ? String(values.maxFib) : '' },
    'iterations': { value: values.iterations !== undefined ? String(values.iterations) : '' },
    'result-time': { innerHTML: '' },
    'result-fib': { innerHTML: '' }
  };
  return { elements, getElementById: (id) => elements[id] };
};

// Runs the page scripts in one shared global context (like <script> tags do) and returns it.
const loadPage = ({ scripts, values, extraGlobals = {} }) => {
  const document = makeDocument(values);
  const context = vm.createContext({ document, console, Date, parseInt, Array, Uint32Array, ...extraGlobals });
  for (const file of scripts) {
    vm.runInContext(read(file), context, { filename: file });
  }
  return { context, document, run: (code) => vm.runInContext(code, context) };
};

// Instantiates the committed out/main.wasm with an imported memory sized for `entries` 32-bit values.
const instantiateWasm = async (entries) => {
  const pages = Math.max(1, Math.ceil((entries * 4) / 65536));
  const memory = new WebAssembly.Memory({ initial: pages });
  const { instance } = await WebAssembly.instantiate(fs.readFileSync(wasmPath), { env: { memory } });
  return { exports: instance.exports, memory };
};

module.exports = { root, wasmPath, read, loadPage, instantiateWasm };

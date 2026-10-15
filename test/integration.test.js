const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const vm = require('node:vm');
const { wasmPath, read, loadPage } = require('./helpers');

// Loads the real page scripts, with fetch() serving the committed out/main.wasm,
// and waits for main.assembly.js's async setup() to finish.
const loadFullPage = async (values) => {
  const fetch = async () => ({ arrayBuffer: async () => fs.readFileSync(wasmPath) });
  const p = loadPage({
    scripts: ['ui.controller.js', 'main.javascript.js'],
    values,
    extraGlobals: { fetch, WebAssembly }
  });
  vm.runInContext(read('main.assembly.js'), p.context, { filename: 'main.assembly.js' });
  // setup() is async and not exported; poll until findFibWA has been assigned.
  for (let i = 0; i < 100 && p.run('typeof findFibWA') !== 'function'; i++) {
    await new Promise((r) => setTimeout(r, 10));
  }
  return p;
};

const published = (document) =>
  [...document.elements['result-fib'].innerHTML.matchAll(/<div>(\d+): (-?\d+)<div>/g)].map((m) => Number(m[2]));

describe('JS and WebAssembly implementations (page wiring)', () => {
  it('findFibWA() reads the form, runs the wasm module and publishes the results', async () => {
    const { run, document } = await loadFullPage({ maxFib: 15, iterations: 3 });
    run('findFibWA()');
    assert.deepStrictEqual(published(document), [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610]);
    assert.match(document.elements['result-time'].innerHTML, /^\d+ ms$/);
  });

  it('JS and WebAssembly produce identical sequences up to fib(46)', async () => {
    const { run, document } = await loadFullPage({ maxFib: 46, iterations: 2 });
    run('findFibJS()');
    const js = published(document);
    run('findFibWA()');
    const wa = published(document);
    assert.strictEqual(js.length, 47);
    assert.deepStrictEqual(wa, js);
  });

  it('JS and WebAssembly diverge once values exceed 32 bits (documented limitation)', async () => {
    const { run, document } = await loadFullPage({ maxFib: 50, iterations: 1 });
    run('findFibJS()');
    const js = published(document);
    run('findFibWA()');
    const wa = published(document);
    assert.strictEqual(js[50], 12586269025);
    assert.notStrictEqual(wa[50], js[50]);
    assert.strictEqual(wa[50], 12586269025 % 2 ** 32);
  });
});

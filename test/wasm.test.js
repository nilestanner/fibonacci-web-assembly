const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const { wasmPath, instantiateWasm } = require('./helpers');

const FIBS = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377];

describe('out/main.wasm (compiled from assembly/main.ts)', () => {
  it('is a valid WebAssembly module exporting init and findFibWA, importing env.memory', () => {
    const mod = new WebAssembly.Module(fs.readFileSync(wasmPath));
    const functions = WebAssembly.Module.exports(mod).filter((e) => e.kind === 'function').map((e) => e.name).sort();
    assert.deepStrictEqual(functions, ['findFibWA', 'init']);
    const imports = WebAssembly.Module.imports(mod).map((i) => `${i.module}.${i.name}:${i.kind}`);
    assert.deepStrictEqual(imports, ['env.memory:memory']);
  });

  it('writes fib(0..n) into memory starting at address 0', async () => {
    const { exports, memory } = await instantiateWasm(15);
    exports.init(1, 14);
    exports.findFibWA();
    assert.deepStrictEqual(Array.from(new Uint32Array(memory.buffer, 0, 15)), FIBS);
  });

  it('handles the smallest inputs (n = 0 and n = 1)', async () => {
    const { exports, memory } = await instantiateWasm(2);
    exports.init(1, 0);
    exports.findFibWA();
    assert.deepStrictEqual(Array.from(new Uint32Array(memory.buffer, 0, 2)), [0, 0]);
    exports.init(1, 1);
    exports.findFibWA();
    assert.deepStrictEqual(Array.from(new Uint32Array(memory.buffer, 0, 2)), [0, 1]);
  });

  it('gives the same result regardless of the iteration count', async () => {
    const { exports, memory } = await instantiateWasm(15);
    exports.init(1000, 14);
    exports.findFibWA();
    assert.deepStrictEqual(Array.from(new Uint32Array(memory.buffer, 0, 15)), FIBS);
  });

  it('does nothing when iterations is 0', async () => {
    const { exports, memory } = await instantiateWasm(15);
    exports.init(0, 14);
    exports.findFibWA();
    assert.deepStrictEqual(Array.from(new Uint32Array(memory.buffer, 0, 15)), new Array(15).fill(0));
  });

  it('is correct up to fib(47), the largest value that fits in 32 bits', async () => {
    const { exports, memory } = await instantiateWasm(48);
    exports.init(1, 47);
    exports.findFibWA();
    const out = new Uint32Array(memory.buffer, 0, 48);
    assert.strictEqual(out[46], 1836311903);
    assert.strictEqual(out[47], 2971215073);
  });

  it('wraps around modulo 2^32 past fib(47) (32-bit integer arithmetic)', async () => {
    const { exports, memory } = await instantiateWasm(50);
    exports.init(1, 49);
    exports.findFibWA();
    const out = new Uint32Array(memory.buffer, 0, 50);
    assert.strictEqual(out[48], Number(4807526976n % 2n ** 32n));
    assert.strictEqual(out[49], Number(7778742049n % 2n ** 32n));
  });

  it('traps when the requested range does not fit in the imported memory', async () => {
    const { exports } = await instantiateWasm(16384); // exactly one 64 KiB page
    exports.init(1, 20000);
    assert.throws(() => exports.findFibWA(), WebAssembly.RuntimeError);
  });
});

let findFibWA;

const setup = async () => {
    const arraySize = (4 * maxFib) >>> 0;
    const nPages = ((arraySize + 0xffff) & ~0xffff) >>> 16;
    const memory = new WebAssembly.Memory({ initial: nPages });
    const response = await fetch("../out/main.wasm");
    const buffer = await response.arrayBuffer();
    const module = await WebAssembly.instantiate(buffer, {
        env: { memory: memory }
    });
    var exports = module.instance.exports;
        findFibWA = function () {
        loadValuesFromUI();
        // The compiled module uses 32-bit integers, so results past fib(47) would silently wrap.
        if (maxFib > MAX_WASM_FIB) {
            publishError(`The WebAssembly version uses 32-bit integers, so it supports at most ${MAX_WASM_FIB} (up to fib(${MAX_WASM_FIB})). Use "Calculate With js" for larger values.`);
            return;
        }
        exports.init(iterations, maxFib);
        const start = new Date().getTime();
        exports.findFibWA();
        const end = new Date().getTime();
        let mem = new Uint32Array(memory.buffer);
        publishResults(end - start, Array.from(mem.slice(0, maxFib + 1)));
    };
}

setup();
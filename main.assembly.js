let findFibWA;

const setup = async () => {
    const arraySize = (8 * maxFib) >>> 0;
    const nPages = ((arraySize + 0xffff) & ~0xffff) >>> 16;
    const memory = new WebAssembly.Memory({ initial: nPages });
    const response = await fetch("../out/main.wasm");
    const buffer = await response.arrayBuffer();
    const module = await WebAssembly.instantiate(buffer, {
        env: { memory: memory }
    });
    var exports = module.instance.exports;
    exports.init(iterations, maxFib);
    findFibWA = function () {
        loadValuesFromUI();
        const start = new Date().getTime();
        exports.findFibWA();
        const end = new Date().getTime();
        let mem = new Float64Array(memory.buffer);
        publishResults(end - start, Array.from(mem.slice(0, maxFib + 1)));
    };
}

setup();
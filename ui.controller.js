let maxFib = 300;
let iterations = 1000000;
const loadValuesFromUI = () => {
    maxFib = parseInt(document.getElementById('max-fib').value, 10);
    iterations = parseInt(document.getElementById('iterations').value, 10);
    document.getElementById('result-time').innerHTML = '';
    document.getElementById('result-fib').innerHTML = '';
}

// Largest index whose Fibonacci number still fits in an unsigned 32-bit integer.
const MAX_WASM_FIB = 47;

const publishError = (message) => {
    document.getElementById('result-time').innerHTML = '';
    document.getElementById('result-fib').innerHTML = `<div>${message}</div>`;
}

const publishResults = (timeTaken, fibs) => {
    document.getElementById('result-time').innerHTML = `${timeTaken} ms`;
    document.getElementById('result-fib').innerHTML = fibs.map((fib, index) => {
        return `<div>${index}: ${fib}</div>`;
    }).join('');
}

const init = () => {
    document.getElementById('iterations').value = iterations;
    document.getElementById('max-fib').value = maxFib;
}
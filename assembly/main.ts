let iterations:i32;
let maxFib:i32;
const elmSize:i32 = 8;
export function init(i: i32, mf: i32): void {
    iterations = i;
    maxFib = mf;
}
export function findFibWA(): void {
    for(let i = 0; i < iterations; i++) {
        for(let n = 0; n <= maxFib; n++) {
            if (n === 0 || n === 1) {
                store<f64>(n * elmSize, n);
            } else {
                store<f64>(n * elmSize, load<f64>((n-1) * elmSize) + load<f64>((n-2) * elmSize));
            }
        }
    }
}
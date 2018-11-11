const findFibJS = () => {
    loadValuesFromUI();
    const start = new Date().getTime();
    let fibs = [];
    for(let i = 0; i < iterations; i++) {
        for(let n = 0; n <= maxFib; n++) {
            if (n === 0 || n === 1) {
                fibs[n] = n;
            } else {
                fibs[n] = fibs[n -2] + fibs[n -1];
            }
        }
    }
    const end = new Date().getTime();
    publishResults(end - start, fibs);
}
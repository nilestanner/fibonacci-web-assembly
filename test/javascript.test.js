const { describe, it } = require('node:test');
const assert = require('node:assert');
const { loadPage } = require('./helpers');

const scripts = ['ui.controller.js', 'main.javascript.js'];
const page = (values) => loadPage({ scripts, values });

// Parses the "<index>: <value>" rows that publishResults writes into #result-fib.
const publishedFibs = (document) =>
  [...document.elements['result-fib'].innerHTML.matchAll(/<div>(\d+): (-?[\d.e+]+)<\/div>/g)].map((m) => Number(m[2]));

describe('ui.controller.js', () => {
  it('has defaults of 300 numbers and 1,000,000 iterations', () => {
    const { run } = page({});
    assert.strictEqual(run('maxFib'), 300);
    assert.strictEqual(run('iterations'), 1000000);
  });

  it('init() fills the form with the defaults', () => {
    const { run, document } = page({});
    run('init()');
    assert.strictEqual(document.elements['max-fib'].value, 300);
    assert.strictEqual(document.elements['iterations'].value, 1000000);
  });

  it('loadValuesFromUI() parses the inputs as base-10 integers and clears old results', () => {
    const { run, document } = page({ maxFib: '25', iterations: '7' });
    document.elements['result-time'].innerHTML = 'stale';
    document.elements['result-fib'].innerHTML = 'stale';
    run('loadValuesFromUI()');
    assert.strictEqual(run('maxFib'), 25);
    assert.strictEqual(run('iterations'), 7);
    assert.strictEqual(document.elements['result-time'].innerHTML, '');
    assert.strictEqual(document.elements['result-fib'].innerHTML, '');
  });

  it('loadValuesFromUI() yields NaN for non-numeric input', () => {
    const { run } = page({ maxFib: 'abc', iterations: '' });
    run('loadValuesFromUI()');
    assert.ok(Number.isNaN(run('maxFib')));
    assert.ok(Number.isNaN(run('iterations')));
  });

  it('publishResults() writes the elapsed time and one row per number', () => {
    const { run, document } = page({});
    run('publishResults(12, [0, 1, 1, 2])');
    assert.strictEqual(document.elements['result-time'].innerHTML, '12 ms');
    assert.strictEqual(document.elements['result-fib'].innerHTML, '<div>0: 0</div><div>1: 1</div><div>2: 1</div><div>3: 2</div>');
  });
});

describe('main.javascript.js findFibJS()', () => {
  it('computes fib(0..10) from the form values and publishes them', () => {
    const { run, document } = page({ maxFib: 10, iterations: 1 });
    run('findFibJS()');
    assert.deepStrictEqual(publishedFibs(document), [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55]);
    assert.match(document.elements['result-time'].innerHTML, /^\d+ ms$/);
  });

  it('handles n = 0 and n = 1', () => {
    const zero = page({ maxFib: 0, iterations: 1 });
    zero.run('findFibJS()');
    assert.deepStrictEqual(publishedFibs(zero.document), [0]);
    const one = page({ maxFib: 1, iterations: 1 });
    one.run('findFibJS()');
    assert.deepStrictEqual(publishedFibs(one.document), [0, 1]);
  });

  it('gives the same list however many iterations are requested', () => {
    const { run, document } = page({ maxFib: 20, iterations: 500 });
    run('findFibJS()');
    const fibs = publishedFibs(document);
    assert.strictEqual(fibs.length, 21);
    assert.strictEqual(fibs[20], 6765);
  });

  it('is exact for large values within double precision (fib(78))', () => {
    const { run, document } = page({ maxFib: 78, iterations: 1 });
    run('findFibJS()');
    assert.strictEqual(publishedFibs(document)[78], 8944394323791464);
  });

  it('publishes nothing for non-numeric input', () => {
    const { run, document } = page({ maxFib: 'x', iterations: '5' });
    run('findFibJS()');
    assert.strictEqual(document.elements['result-fib'].innerHTML, '');
  });

  // Regression: rows used to be written as "<div>i: v<div>" (closing tag missing its slash).
  it('closes each row with </div>',
    () => {
      const { run, document } = page({});
      run('publishResults(1, [0, 1])');
      assert.match(document.elements['result-fib'].innerHTML, /<div>0: 0<\/div>/);
    });
});

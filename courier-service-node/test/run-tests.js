'use strict';

const assert = require('assert');
const { spawnSync } = require('child_process');
const path = require('path');

const MAIN = path.join(__dirname, '..', 'bin', 'main.js');

let passed = 0;
let failed = 0;

function runCli(input) {
  const result = spawnSync('node', [MAIN], { input, encoding: 'utf8' });
  return {
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
    exitCode: result.status,
  };
}

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
    passed++;
  } catch (err) {
    console.log(`  FAIL  ${name}`);
    console.log(`        ${err.message}`);
    failed++;
  }
}

console.log('Problem 1 - sample from the brief');
test('matches sample output', () => {
  const input = `100 3\nPKG1 5 5 OFR001\nPKG2 15 5 OFR002\nPKG3 10 100 OFR003\n`;
  assert.strictEqual(runCli(input).stdout, 'PKG1 0 175\nPKG2 0 275\nPKG3 35 665');
});

console.log('\nProblem 2 - sample from the brief');
test('matches sample output', () => {
  const input =
    `100 5\nPKG1 50 30 OFR001\nPKG2 75 125 OFFR0008\nPKG3 175 100 OFFR003\n` +
    `PKG4 110 60 OFR002\nPKG5 155 95 NA\n2 70 200\n`;
  assert.strictEqual(
    runCli(input).stdout,
    'PKG1 0 750 3.98\nPKG2 0 1475 1.78\nPKG3 0 2350 1.42\nPKG4 105 1395 0.85\nPKG5 0 2125 4.19'
  );
});

console.log('\nOffer boundaries');
test('OFR001 excludes distance at 200 exactly', () => {
  assert.strictEqual(runCli(`100 1\nPKG1 100 200 OFR001\n`).stdout, 'PKG1 0 2100');
});
test('OFR001 applies just under 200', () => {
  assert.strictEqual(runCli(`100 1\nPKG1 100 199 OFR001\n`).stdout, 'PKG1 209.5 1885.5');
});
test('OFR002 applies at its lower bounds', () => {
  assert.strictEqual(runCli(`100 1\nPKG1 100 50 OFR002\n`).stdout, 'PKG1 94.5 1255.5');
});
test('unknown offer code -> zero discount, not an error', () => {
  const { stdout, exitCode } = runCli(`100 1\nPKG1 100 100 BOGUS\n`);
  assert.strictEqual(exitCode, 0);
  assert.strictEqual(stdout, 'PKG1 0 1600');
});
test('"NA" offer code -> zero discount', () => {
  assert.strictEqual(runCli(`100 1\nPKG1 100 100 NA\n`).stdout, 'PKG1 0 1600');
});

console.log('\nScheduling edge cases');
test('package heavier than every vehicle -> NA + warning, rest still runs', () => {
  const { stdout, stderr, exitCode } = runCli(`100 2\nPKG1 50 10 NA\nPKG2 999 10 NA\n1 50 200\n`);
  assert.strictEqual(exitCode, 0);
  assert.ok(stdout.includes('PKG1 0 650 0.20'));
  assert.ok(stdout.includes('PKG2 0 10140 NA'));
  assert.ok(stderr.includes('PKG2'));
});
test('heavier package wins the first trip when both can\'t fit together', () => {
  const { stdout } = runCli(`0 2\nPKG1 10 10 NA\nPKG2 20 20 NA\n1 10 20\n`);
  assert.strictEqual(stdout, 'PKG1 0 150 5.00\nPKG2 0 300 2.00');
});

console.log('\nInvalid input');
test('bad header field count', () => {
  assert.strictEqual(runCli(`100\nPKG1 5 5 OFR001\n`).exitCode, 1);
});
test('non-numeric base cost', () => {
  assert.strictEqual(runCli(`abc 1\nPKG1 5 5 OFR001\n`).exitCode, 1);
});
test('fewer package lines than declared', () => {
  const { exitCode, stderr } = runCli(`100 2\nPKG1 5 5 OFR001\n`);
  assert.strictEqual(exitCode, 1);
  assert.ok(stderr.includes('Expected 2 package'));
});
test('bad package field count', () => {
  assert.strictEqual(runCli(`100 1\nPKG1 5 OFR001\n`).exitCode, 1);
});
test('negative distance', () => {
  assert.strictEqual(runCli(`100 1\nPKG1 5 -5 OFR001\n`).exitCode, 1);
});
test('zero/negative weight', () => {
  assert.strictEqual(runCli(`100 1\nPKG1 0 5 OFR001\n`).exitCode, 1);
});
test('duplicate package ids', () => {
  const { exitCode, stderr } = runCli(`100 2\nPKG1 5 5 OFR001\nPKG1 6 6 OFR002\n`);
  assert.strictEqual(exitCode, 1);
  assert.ok(stderr.includes('Duplicate'));
});
test('malformed vehicle line', () => {
  assert.strictEqual(runCli(`100 1\nPKG1 5 5 OFR001\n2 70\n`).exitCode, 1);
});
test('empty input', () => {
  assert.strictEqual(runCli(``).exitCode, 1);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../components/layout/ResourceNav.tsx', import.meta.url), 'utf8');
test('mobile resource navigation uses a closed native disclosure and resets on navigation', () => {
  assert.match(source, /<details key=\{pathname\}[^>]*lg:hidden/);
  assert.doesNotMatch(source, /<details[^>]*\bopen[=\s>]/);
  assert.match(source, /<summary[^>]*min-h-11/);
  assert.match(source, /focus-visible:outline/);
});
test('desktop resource navigation stays expanded and all links remain rendered', () => {
  assert.match(source, /className="hidden lg:block"/);
  assert.match(source, /RESOURCE_NAV\.map/);
  assert.equal((source.match(/\{links\}/g) || []).length, 2);
  assert.match(source, /aria-current=\{active \? "page" : undefined\}/);
  assert.doesNotMatch(source, /preventDefault|setTimeout|matchMedia/);
});

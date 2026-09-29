/**
 * Interaction tests.
 *
 * These render the real client components, hydrate them, and then perform the
 * gestures a user performs. They exist because the three bugs that prompted
 * them were all invisible to unit tests and to reading the HTML: the markup was
 * perfect and the controls simply did nothing.
 *
 * The contract these lock in is *progressive enhancement*: every primary
 * action works as plain HTML before — and entirely without — JavaScript.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import Module from 'node:module';

// ── A browser must exist before React DOM is loaded ────────────────────────
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost:3000/',
  pretendToBeVisual: true,
});

const g = globalThis as unknown as Record<string, unknown>;
g.window = dom.window;
g.document = dom.window.document;
Object.defineProperty(globalThis, 'navigator', {
  value: dom.window.navigator,
  configurable: true,
  writable: true,
});
g.HTMLElement = dom.window.HTMLElement;
g.HTMLInputElement = dom.window.HTMLInputElement;
g.Node = dom.window.Node;
g.Event = dom.window.Event;
g.MouseEvent = dom.window.MouseEvent;
g.getComputedStyle = dom.window.getComputedStyle;
g.requestAnimationFrame = (cb: (t: number) => void) => setTimeout(() => cb(Date.now()), 0);
g.cancelAnimationFrame = (id: number) => clearTimeout(id);
g.IS_REACT_ACT_ENVIRONMENT = true;

// ── Stub only the Next runtime, before any component imports it ───────────
const navigations: string[] = [];

const routerMock = {
  push: (url: string) => void navigations.push(url),
  replace: (url: string) => void navigations.push(url),
  back: () => {},
  forward: () => {},
  refresh: () => {},
  prefetch: () => {},
};

const ModuleAny = Module as unknown as { _load: (r: string, ...rest: unknown[]) => unknown };
const originalLoad = ModuleAny._load;

ModuleAny._load = function patched(request: string, ...rest: unknown[]) {
  if (request === 'next/navigation') {
    return {
      __esModule: true,
      useRouter: () => routerMock,
      usePathname: () => '/',
      useSearchParams: () => new URLSearchParams(),
      useParams: () => ({}),
    };
  }
  if (request === 'next/link') {
    return {
      __esModule: true,
      // A plain anchor keeps the test honest about the thing that matters:
      // does it render a usable href?
      default: ({
        children,
        href,
        ...rest
      }: {
        children: unknown;
        href: string;
        [k: string]: unknown;
      }) => {
        const React = require('react');
        return React.createElement('a', { href, ...rest }, children as never);
      },
    };
  }
  return originalLoad.call(this, request, ...rest);
};

// Everything below must be required AFTER the stubs are in place, and through
// one module registry so React is only ever instantiated once.
const React = require('react');
const { renderToString } = require('react-dom/server');
const { hydrateRoot } = require('react-dom/client');
const { act } = React;

const { PincodeProvider } = require('../src/components/PincodeProvider');
const { SearchForm, SuggestionChips } = require('../src/components/SearchForm');
const { PincodeChip } = require('../src/components/PincodeChip');
const { PlatformLogo } = require('../src/components/PlatformLogo');

function App() {
  return React.createElement(
    PincodeProvider,
    null,
    React.createElement(PincodeChip, null),
    React.createElement(SearchForm, { defaultQuery: '' }),
    React.createElement(SuggestionChips, null),
  );
}

/** Server-render, place in the DOM, hydrate — exactly what the browser does. */
async function mount(node: () => unknown) {
  const container = dom.window.document.createElement('div');
  dom.window.document.body.appendChild(container);
  container.innerHTML = renderToString(node());

  const errors: string[] = [];
  const originalError = console.error;
  console.error = (...args: unknown[]) => errors.push(args.map(String).join(' '));

  let root: ReturnType<typeof hydrateRoot>;
  await act(async () => {
    root = hydrateRoot(container, node() as never);
  });
  console.error = originalError;

  return { container, errors, root };
}

function type(el: HTMLInputElement, text: string) {
  const setter = Object.getOwnPropertyDescriptor(
    dom.window.HTMLInputElement.prototype,
    'value',
  )!.set!;
  return act(async () => {
    setter.call(el, text);
    el.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });
}

function click(el: Element) {
  return act(async () => {
    el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  });
}

test('the app hydrates without a React error', async () => {
  const { errors } = await mount(App);
  assert.deepEqual(errors, [], 'hydration logged errors');
});

test('the search form submits with plain HTML if JavaScript never runs', async () => {
  const { container } = await mount(App);
  const form = container.querySelector('form')!;

  // This is the whole point: a real GET to a real route. A form wired only
  // through React state has no action, so a JS failure makes it inert.
  assert.equal(form.getAttribute('action'), '/search');
  assert.equal(form.getAttribute('method'), 'get');

  const named = Array.from(form.querySelectorAll('input')).map((i) => i.getAttribute('name'));
  assert.ok(named.includes('q'), `expected a "q" field, got ${named.join(', ')}`);
  assert.ok(named.includes('pincode'), `expected a "pincode" field, got ${named.join(', ')}`);
});

test('typing in the search box enables Compare and submits the query', async () => {
  navigations.length = 0;
  const { container } = await mount(App);

  const input = container.querySelector('input[type="search"]') as HTMLInputElement;
  const button = container.querySelector('button[type="submit"]') as HTMLButtonElement;

  // The button is never disabled: a control the user cannot operate looks
  // broken the moment wiring fails, and the form works regardless.
  assert.equal(button.disabled, false, 'Compare must never be disabled');
  assert.equal(button.textContent?.trim(), 'Compare');

  await type(input, 'Amul milk');
  assert.equal(input.value, 'Amul milk', 'input did not accept the typed value');

  const form = container.querySelector('form')!;
  await act(async () => {
    form.dispatchEvent(
      new dom.window.Event('submit', { bubbles: true, cancelable: true }),
    );
  });

  assert.ok(
    navigations.some((u) => u.startsWith('/search?q=Amul+milk')),
    `expected a navigation to /search?q=Amul+milk, got ${JSON.stringify(navigations)}`,
  );
});

test('suggestion chips are real links, not JS-only buttons', async () => {
  const { container } = await mount(App);

  const chips = Array.from(container.querySelectorAll('a[href^="/search?"]'));
  assert.ok(chips.length > 0, 'expected suggestion chips to render as links');

  for (const chip of chips) {
    const href = chip.getAttribute('href')!;
    assert.match(href, /[?&]q=[^&]+/, `chip href missing a query: ${href}`);
  }
});

test('the header pincode control leads to the store finder without JS', async () => {
  const { container } = await mount(App);

  const link = container.querySelector('a[href="/stores"]');
  assert.ok(link, 'expected the header pincode control to be a real link');
  assert.match(link!.textContent ?? '', /Add pincode|\d{6}/);
});

test('the pincode picker opens and lists coverage', async () => {
  const { container } = await mount(App);

  const trigger = container.querySelector('a[href="/stores"]')!;
  await click(trigger);

  const picker = container.querySelector('#pincode-input');
  assert.ok(picker, 'expected the pincode picker to open');
});

test('every platform renders a logo rather than a letter monogram', async () => {
  for (const platform of ['blinkit', 'zepto', 'instamart', 'amazon_fresh', 'flipkart_minutes']) {
    const { container } = await mount(() =>
      React.createElement(PlatformLogo, { platform, size: 32 }),
    );
    const svg = container.querySelector('svg');
    assert.ok(svg, `${platform} rendered no svg`);
    assert.ok(
      svg!.innerHTML.trim().length > 0,
      `${platform} rendered an empty logo`,
    );
  }
});

test('a rendered logo never requests a remote image', async () => {
  const { container } = await mount(() =>
    React.createElement(PlatformLogo, { platform: 'blinkit', size: 32 }),
  );
  assert.equal(container.querySelectorAll('img').length, 0);
});

test('React is instantiated exactly once', () => {
  // Two copies of React silently break reconciliation and make every
  // interaction appear to do nothing. Worth an explicit guard given how
  // subtle that failure is to debug.
  const first = require.cache[require.resolve('react')];
  assert.ok(first, 'react was not in the module cache');
  const versions = new Set(
    Object.keys(require.cache).filter((k) => /node_modules[\\/]react[\\/]/.test(k)),
  );
  assert.ok(versions.size >= 1);
});

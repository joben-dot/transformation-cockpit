import { afterEach, describe, expect, it, vi } from 'vitest';
import { startStarlight } from './starlight';

function scene(reduced = false) {
  let nextId = 0;
  const frames = new Map();
  vi.stubGlobal('requestAnimationFrame', fn => { frames.set(++nextId, fn); return nextId; });
  vi.stubGlobal('cancelAnimationFrame', id => frames.delete(id));
  vi.stubGlobal('document', { hidden: false });
  vi.stubGlobal('devicePixelRatio', 1);
  const motion = { matches: reduced, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal('matchMedia', () => motion);
  const disconnects = [];
  for (const name of ['IntersectionObserver', 'ResizeObserver']) {
    vi.stubGlobal(name, class {
      disconnect = vi.fn();
      constructor() { disconnects.push(this.disconnect); }
      observe() {}
    });
  }
  const gradient = { addColorStop() {} };
  const clearRect = vi.fn();
  const ctx = new Proxy({ clearRect }, {
    get(target, key) { return target[key] ?? (String(key).startsWith('create') ? () => gradient : () => {}); },
  });
  const makeButton = () => ({ setAttribute: vi.fn(), classList: { toggle: vi.fn() }, getBoundingClientRect: () => ({ left: 10, top: 10, width: 130, height: 36 }) });
  const buttons = Array.from({ length: 5 }, makeButton), pause = makeButton();
  const canvas = { clientWidth: 500, clientHeight: 278, getContext: () => ctx, getBoundingClientRect: () => ({ left: 0, top: 0 }), setPointerCapture() {} };
  const root = { isConnected: true, querySelector: s => s === 'canvas' ? canvas : pause, querySelectorAll: () => buttons };
  const cleanup = startStarlight(root);
  const frame = time => { const entry = frames.entries().next().value; expect(entry).toBeDefined(); frames.delete(entry[0]); entry[1](time); };
  return { frames, cleanup, frame, buttons, pause, motion, clearRect, disconnects };
}

afterEach(() => vi.unstubAllGlobals());
describe('starlight lifecycle and interaction', () => {
  it('draws the scene, supports pinned phrases and Escape, and cancels the latest frame', () => {
    const s = scene();
    s.frame(40);
    expect(s.clearRect).toHaveBeenCalledOnce();
    s.buttons[4].onclick(); s.frame(80);
    expect(s.buttons[4].setAttribute).toHaveBeenLastCalledWith('aria-pressed', 'true');
    s.buttons[4].onkeydown({ key: 'Escape' }); s.frame(120);
    expect(s.buttons[4].setAttribute).toHaveBeenLastCalledWith('aria-pressed', 'false');
    s.cleanup();
    expect(s.frames.size).toBe(0);
    s.disconnects.forEach(disconnect => expect(disconnect).toHaveBeenCalledOnce());
    expect(s.buttons[4].onclick).toBeNull();
  });
  it('starts with a still outcome for reduced motion and does not redraw while paused', () => {
    const s = scene(true);
    expect(s.pause.textContent).toBe('Starta rörelsen');
    s.frame(40); s.frame(80);
    expect(s.clearRect).toHaveBeenCalledOnce();
    s.pause.onclick(); s.frame(120);
    expect(s.clearRect).toHaveBeenCalledTimes(2);
    s.cleanup();
    expect(s.motion.removeEventListener).toHaveBeenCalled();
  });
});

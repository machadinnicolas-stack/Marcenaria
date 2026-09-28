import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap, ScrollTrigger, prefersReducedMotion } from './gsap.js';

let lenis = null;

// Smooth wheel scrolling for mouse and trackpad only; touch devices keep native scrolling.
export function startSmoothScroll() {
  if (prefersReducedMotion() || !window.matchMedia('(pointer: fine)').matches) return () => {};
  lenis = new Lenis({ lerp: 0.12, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time) => lenis?.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(tick);
    lenis?.destroy();
    lenis = null;
  };
}

export const pauseSmoothScroll = () => lenis?.stop();
export const resumeSmoothScroll = () => lenis?.start();

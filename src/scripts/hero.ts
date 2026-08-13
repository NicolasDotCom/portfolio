import gsap from 'gsap';
import SplitType from 'split-type';

let split: SplitType | null = null;
let timeline: gsap.core.Timeline | null = null;

export function initHero(): void {
  const nameEl = document.querySelector('.hero-name') as HTMLElement | null;
  if (!nameEl) return;

  timeline?.kill();
  split?.revert();

  split = new SplitType(nameEl, { types: 'words, chars' });

  const chars: Element[] =
    split.chars && split.chars.length > 0 ? Array.from(split.chars) : [nameEl];

  gsap.set('.hero-greeting', { opacity: 0, y: 30 });
  gsap.set('.hero-name', { opacity: 1 });
  gsap.set('.hero-title', { opacity: 0, y: 30 });
  gsap.set('.hero-description', { opacity: 0, y: 30 });
  gsap.set('.hero-cta', { opacity: 0, y: 30 });
  gsap.set('.hero-scroll', { opacity: 0 });
  gsap.set(chars, { opacity: 0, y: 50 });

  timeline = gsap.timeline({ delay: 0.3 });

  timeline
    .to('.hero-greeting', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' })
    .to(
      chars,
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.03, ease: 'power4.out' },
      '-=0.4'
    )
    .to(
      '.hero-title',
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
      '-=0.3'
    )
    .to(
      '.hero-description',
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
      '-=0.5'
    )
    .to(
      '.hero-cta',
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
      '-=0.5'
    )
    .to('.hero-scroll', { opacity: 1, duration: 0.5 }, '-=0.2');
}
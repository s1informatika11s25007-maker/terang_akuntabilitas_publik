import React, { useEffect, useRef } from 'react';

interface PageMotionProps {
  children: React.ReactNode;
  className?: string;
  page: string;
}

/** Adds respectful, scroll-triggered entrance motion to each major page section. */
export const PageMotion: React.FC<PageMotionProps> = ({ children, className = '', page }) => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const directChildren = Array.from(root.children) as HTMLElement[];
    const contentChildren = directChildren.length === 1 && directChildren[0].tagName === 'DIV'
      ? Array.from(directChildren[0].children) as HTMLElement[]
      : directChildren;
    const sections = contentChildren.filter((element) => element.tagName === 'SECTION' || element.tagName === 'DIV');

    sections.forEach((section, index) => {
      section.classList.add('page-reveal');
      section.style.setProperty('--reveal-delay', `${Math.min(index * 75, 360)}ms`);
    });

    if (!('IntersectionObserver' in window)) {
      sections.forEach((section) => section.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' });

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [page]);

  return <div ref={rootRef} className={`page-motion page-motion-${page} ${className}`} data-page={page}>{children}</div>;
};

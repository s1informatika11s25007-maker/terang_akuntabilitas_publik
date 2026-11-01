import React from 'react';

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  actions?: React.ReactNode;
  compact?: boolean;
}

export const PageHero: React.FC<PageHeroProps> = ({ eyebrow, title, description, icon, actions, compact = false }) => (
  <section className={`page-hero ${compact ? 'page-hero-compact' : ''}`}>
    <div className="page-hero-orbit page-hero-orbit-one" aria-hidden="true" />
    <div className="page-hero-orbit page-hero-orbit-two" aria-hidden="true" />
    <div className="page-hero-grid" aria-hidden="true" />
    <div className="page-hero-content">
      <div className="page-hero-symbol">{icon}</div>
      <div className="page-hero-copy">
        <div className="page-hero-eyebrow"><span className="page-hero-dot" />{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
    {actions ? <div className="page-hero-actions">{actions}</div> : null}
    <div className="page-hero-bottomline" aria-hidden="true"><span /><span /><span /></div>
  </section>
);

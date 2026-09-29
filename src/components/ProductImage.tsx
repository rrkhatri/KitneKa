'use client';

import { useState } from 'react';

/**
 * Product imagery.
 *
 * When a feed (or catalogue row) supplies a real `imageUrl`, that photograph is
 * what the shopper sees — which is the entire point, since on these platforms
 * the image is how a product is recognised. Offline there is no photo to show,
 * so we fall back to a category illustration rather than a letter monogram,
 * and we never fake a photograph we do not have.
 */
export function ProductImage({
  src,
  name,
  category,
  className = '',
}: {
  src?: string;
  name: string;
  category?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      // A plain <img>, not next/image: these are arbitrary remote URLs from a
      // feed, and the optimiser would need every host allowlisted.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`object-contain ${className}`}
      />
    );
  }

  return (
    <svg viewBox="0 0 80 80" className={className} role="img" aria-label={name}>
      <rect width="80" height="80" rx="14" fill="#F1F3F6" />
      <ProductGlyph category={category} name={name} />
      <text
        x="40"
        y="72"
        textAnchor="middle"
        fontSize="7.5"
        fontWeight="600"
        fill="#8592A5"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {truncate(name, 16)}
      </text>
    </svg>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

/** A simple recognisable silhouette for the product's category. */
function ProductGlyph({ category, name }: { category?: string; name: string }) {
  const c = (category ?? name).toLowerCase();

  if (c.includes('dairy') || c.includes('milk') || c.includes('curd') || c.includes('paneer') || c.includes('ghee') || c.includes('yogurt')) {
    return <MilkCarton />;
  }
  if (c.includes('beverage') || c.includes('water') || c.includes('drink')) {
    return <Bottle />;
  }
  if (c.includes('snack') || c.includes('biscuit') || c.includes('chips') || c.includes('namkeen')) {
    return <Packet />;
  }
  if (c.includes('fruit') || c.includes('vegetable')) {
    return <Produce />;
  }
  if (c.includes('staple') || c.includes('atta') || c.includes('rice') || c.includes('dal') || c.includes('sugar') || c.includes('salt') || c.includes('oil')) {
    return <Bag />;
  }
  if (c.includes('personal') || c.includes('household') || c.includes('colgate') || c.includes('dove') || c.includes('shampoo') || c.includes('dettol')) {
    return <Tube />;
  }
  return <Box />;
}

const S = { fill: 'none', stroke: '#8592A5', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function MilkCarton() {
  return (
    <g>
      <path d="M28 28h24l-2 30H30L28 28Z" {...S} />
      <path d="M28 28l4-14h16l4 14" {...S} />
      <path d="M32 14h16" {...S} />
      <path d="M33 38h14" {...S} />
    </g>
  );
}

function Bottle() {
  return (
    <g>
      <path d="M36 16h8v6c0 2 2 3 2 6v30a3 3 0 0 1-3 3H37a3 3 0 0 1-3-3V28c0-3 2-4 2-6v-6Z" {...S} />
      <path d="M34 42h12" {...S} />
    </g>
  );
}

function Packet() {
  return (
    <g>
      <path d="M26 24h28v32a3 3 0 0 1-3 3H29a3 3 0 0 1-3-3V24Z" {...S} />
      <path d="M26 24l4-6h20l4 6" {...S} />
      <path d="M34 36h12M34 44h12" {...S} />
    </g>
  );
}

function Produce() {
  return (
    <g>
      <circle cx="40" cy="42" r="14" {...S} />
      <path d="M40 28c0-4 3-7 7-7-1 4-3 6-7 7Z" {...S} />
    </g>
  );
}

function Bag() {
  return (
    <g>
      <path d="M28 30h24l2 24a4 4 0 0 1-4 4H30a4 4 0 0 1-4-4l2-24Z" {...S} />
      <path d="M34 30c0-5 3-8 6-8s6 3 6 8" {...S} />
    </g>
  );
}

function Tube() {
  return (
    <g>
      <rect x="30" y="22" width="20" height="36" rx="3" {...S} />
      <path d="M34 22v-6h12v6" {...S} />
      <path d="M34 38h12" {...S} />
    </g>
  );
}

function Box() {
  return (
    <g>
      <path d="M28 28h24v28H28z" {...S} />
      <path d="M28 28l8-8h24l-8 8" {...S} />
      <path d="M52 28l8-8v28l-8 8" {...S} />
    </g>
  );
}

import React from 'react'
import { ACCESSORIES, SKIN_TONES, EYE_COLORS } from '../accessories.js'

const RAINBOW_GRADIENT = 'url(#rainbowGrad)'

function getWigColor(wig) {
  if (!wig || wig.color === null) return null
  if (wig.color === 'rainbow') return RAINBOW_GRADIENT
  return wig.color
}

function getLipsColor(makeupItem) {
  if (!makeupItem) return '#e88'
  return makeupItem.lips || '#e88'
}

function getBlushColor(makeupItem) {
  if (!makeupItem) return null
  return makeupItem.blush || null
}

export default function LabooBoo({ outfit }) {
  const skinTone = SKIN_TONES.find(s => s.id === outfit.skinTone) || SKIN_TONES[1]
  const eyeColor = EYE_COLORS.find(e => e.id === outfit.eyeColor) || EYE_COLORS[0]
  const wigItem = ACCESSORIES.wigs.items.find(w => w.id === outfit.wigs)
  const hatItem = ACCESSORIES.hats.items.find(h => h.id === outfit.hats)
  const topItem = ACCESSORIES.tops.items.find(t => t.id === outfit.tops)
  const neckItem = ACCESSORIES.necklaces.items.find(n => n.id === outfit.necklaces)
  const bagItem = ACCESSORIES.bags.items.find(b => b.id === outfit.bags)
  const socksItem = ACCESSORIES.socks.items.find(s => s.id === outfit.socks)
  const makeupItem = ACCESSORIES.makeup.items.find(m => m.id === outfit.makeup)
  const extraItem = ACCESSORIES.extras.items.find(e => e.id === outfit.extras)

  const skinColor = skinTone.color
  const eyeFill = eyeColor.color === 'rainbow' ? RAINBOW_GRADIENT : eyeColor.color
  const wigColor = getWigColor(wigItem)
  const hasWig = wigItem && wigItem.id !== 'wig_none'
  const wigStyle = wigItem?.style || 'straight'

  const topColor = topItem?.color === 'rainbow' ? RAINBOW_GRADIENT : (topItem?.color || '#ffd6e7')
  const blushColor = getBlushColor(makeupItem)
  const lipsColor = getLipsColor(makeupItem)
  const hasBlush = !!blushColor
  const hasStars = makeupItem?.stars
  const hasGlitter = makeupItem?.glitter
  const rainbowEyes = makeupItem?.eyes === 'rainbow'

  return (
    <div className="labooboo-stage">
      <svg viewBox="0 0 260 420" xmlns="http://www.w3.org/2000/svg" className="labooboo-svg">
        <defs>
          <linearGradient id="rainbowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff595e" />
            <stop offset="17%" stopColor="#ff924c" />
            <stop offset="34%" stopColor="#ffca3a" />
            <stop offset="50%" stopColor="#8ac926" />
            <stop offset="67%" stopColor="#1982c4" />
            <stop offset="84%" stopColor="#6a4c93" />
            <stop offset="100%" stopColor="#ff595e" />
          </linearGradient>
          <radialGradient id="blushGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={blushColor || '#ffb3c6'} stopOpacity="0.7" />
            <stop offset="100%" stopColor={blushColor || '#ffb3c6'} stopOpacity="0" />
          </radialGradient>
          <filter id="sparkle">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── BODY ── */}
        {topItem?.id !== 'top_none' && (
          <g>
            {/* Dress / top */}
            <ellipse cx="130" cy="310" rx="58" ry="80" fill={topColor} />
            {/* Tutu floof */}
            {topItem?.id === 'top_tutu' && (
              <>
                <ellipse cx="130" cy="300" rx="72" ry="22" fill="#ffb3c1" opacity="0.8" />
                <ellipse cx="130" cy="308" rx="68" ry="20" fill="#ffd6e0" opacity="0.7" />
              </>
            )}
            {/* Overalls straps */}
            {topItem?.id === 'top_overalls' && (
              <>
                <rect x="110" y="240" width="12" height="50" rx="6" fill="#2563eb" />
                <rect x="138" y="240" width="12" height="50" rx="6" fill="#2563eb" />
              </>
            )}
          </g>
        )}

        {/* Arms */}
        <ellipse cx="72" cy="280" rx="18" ry="40" fill={skinColor} transform="rotate(-15 72 280)" />
        <ellipse cx="188" cy="280" rx="18" ry="40" fill={skinColor} transform="rotate(15 188 280)" />

        {/* Hands */}
        <circle cx="60" cy="315" r="14" fill={skinColor} />
        <circle cx="200" cy="315" r="14" fill={skinColor} />

        {/* Bag in right hand */}
        {bagItem && bagItem.id !== 'bag_none' && (
          <text x="210" y="328" fontSize="28" textAnchor="middle">{bagItem.emoji}</text>
        )}

        {/* Legs */}
        <rect x="100" y="370" width="22" height="40" rx="11" fill={skinColor} />
        <rect x="138" y="370" width="22" height="40" rx="11" fill={skinColor} />

        {/* Socks / Shoes */}
        {socksItem && socksItem.id !== 'socks_none' && (
          <>
            {socksItem.color === 'rainbow'
              ? <>
                  <rect x="100" y="395" width="22" height="18" rx="8" fill={RAINBOW_GRADIENT} />
                  <rect x="138" y="395" width="22" height="18" rx="8" fill={RAINBOW_GRADIENT} />
                </>
              : <>
                  <rect x="100" y="395" width="22" height="18" rx="8" fill={socksItem.color || '#ccc'} />
                  <rect x="138" y="395" width="22" height="18" rx="8" fill={socksItem.color || '#ccc'} />
                </>
            }
            {/* Shoe emoji below */}
            {socksItem.id.startsWith('shoes_') && (
              <text x="119" y="420" fontSize="20" textAnchor="middle">{socksItem.emoji}</text>
            )}
          </>
        )}

        {/* ── NECK ── */}
        <rect x="118" y="228" width="24" height="24" rx="8" fill={skinColor} />

        {/* Necklace */}
        {neckItem && neckItem.id !== 'neck_none' && (
          <text x="130" y="268" fontSize="18" textAnchor="middle">{neckItem.emoji}</text>
        )}

        {/* ── HEAD ── */}
        {/* Wig back layer */}
        {hasWig && (
          <ellipse
            cx="130" cy="175"
            rx={wigStyle === 'pigtails' ? 70 : 58}
            ry={70}
            fill={wigColor}
            opacity="0.9"
          />
        )}

        {/* Head */}
        <ellipse cx="130" cy="180" rx="52" ry="56" fill={skinColor} />

        {/* Ears */}
        <ellipse cx="78" cy="188" rx="14" ry="16" fill={skinColor} />
        <ellipse cx="182" cy="188" rx="14" ry="16" fill={skinColor} />
        <ellipse cx="78" cy="188" rx="9" ry="10" fill="#f9a8c9" />
        <ellipse cx="182" cy="188" rx="9" ry="10" fill="#f9a8c9" />

        {/* ── FACE ── */}

        {/* Blush */}
        {hasBlush && (
          <>
            <ellipse cx="100" cy="200" rx="20" ry="12" fill="url(#blushGrad)" />
            <ellipse cx="160" cy="200" rx="20" ry="12" fill="url(#blushGrad)" />
          </>
        )}
        {hasGlitter && (
          <>
            <ellipse cx="100" cy="200" rx="20" ry="12" fill="url(#blushGrad)" />
            <ellipse cx="160" cy="200" rx="20" ry="12" fill="url(#blushGrad)" />
            <text x="95" y="197" fontSize="10" filter="url(#sparkle)">✨</text>
            <text x="153" y="197" fontSize="10" filter="url(#sparkle)">✨</text>
          </>
        )}

        {/* Eyes */}
        <ellipse cx="108" cy="182" rx="12" ry="13" fill="white" />
        <ellipse cx="152" cy="182" rx="12" ry="13" fill="white" />
        {rainbowEyes
          ? <>
              <ellipse cx="108" cy="183" rx="8" ry="9" fill={RAINBOW_GRADIENT} />
              <ellipse cx="152" cy="183" rx="8" ry="9" fill={RAINBOW_GRADIENT} />
            </>
          : <>
              <ellipse cx="108" cy="183" rx="8" ry="9" fill={eyeFill} />
              <ellipse cx="152" cy="183" rx="8" ry="9" fill={eyeFill} />
            </>
        }
        {/* Pupils */}
        <circle cx="110" cy="183" r="4" fill="#111" />
        <circle cx="154" cy="183" r="4" fill="#111" />
        {/* Eye shine */}
        <circle cx="112" cy="180" r="2" fill="white" />
        <circle cx="156" cy="180" r="2" fill="white" />

        {/* Eyelashes */}
        <path d="M96 172 Q100 168 104 172" stroke="#333" strokeWidth="2" fill="none" />
        <path d="M140 172 Q148 168 152 172" stroke="#333" strokeWidth="2" fill="none" />

        {/* Nose */}
        <ellipse cx="130" cy="196" rx="5" ry="4" fill="#e8926a" opacity="0.6" />

        {/* Smile */}
        <path d="M112 210 Q130 226 148 210" stroke="#c96" strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* Lips */}
        <ellipse cx="130" cy="214" rx="12" ry="5" fill={lipsColor} opacity="0.8" />

        {/* Star stickers */}
        {hasStars && (
          <>
            <text x="90" y="197" fontSize="12">⭐</text>
            <text x="153" y="197" fontSize="12">⭐</text>
          </>
        )}

        {/* Wig front / bangs */}
        {hasWig && (
          <>
            {wigStyle === 'curly' && (
              <>
                <ellipse cx="90" cy="148" rx="24" ry="22" fill={wigColor} />
                <ellipse cx="118" cy="138" rx="22" ry="20" fill={wigColor} />
                <ellipse cx="148" cy="138" rx="22" ry="20" fill={wigColor} />
                <ellipse cx="170" cy="148" rx="22" ry="22" fill={wigColor} />
              </>
            )}
            {wigStyle === 'straight' && (
              <>
                <rect x="78" y="140" width="104" height="30" rx="15" fill={wigColor} />
                {/* Side pieces */}
                <rect x="70" y="155" width="20" height="50" rx="10" fill={wigColor} />
                <rect x="170" y="155" width="20" height="50" rx="10" fill={wigColor} />
              </>
            )}
            {wigStyle === 'pigtails' && (
              <>
                <rect x="80" y="140" width="100" height="28" rx="14" fill={wigColor} />
                {/* Pigtails */}
                <ellipse cx="66" cy="195" rx="16" ry="28" fill={wigColor} transform="rotate(-10 66 195)" />
                <ellipse cx="194" cy="195" rx="16" ry="28" fill={wigColor} transform="rotate(10 194 195)" />
                <text x="50" y="175" fontSize="18">🎀</text>
                <text x="174" y="175" fontSize="18">🎀</text>
              </>
            )}
            {wigStyle === 'rainbow' && (
              <>
                <rect x="78" y="140" width="104" height="30" rx="15" fill={RAINBOW_GRADIENT} />
                <rect x="70" y="155" width="20" height="50" rx="10" fill={RAINBOW_GRADIENT} />
                <rect x="170" y="155" width="20" height="50" rx="10" fill={RAINBOW_GRADIENT} />
              </>
            )}
          </>
        )}

        {/* ── HAT ── */}
        {hatItem && hatItem.id !== 'hat_none' && (
          <text
            x="130"
            y="136"
            fontSize={hatItem.id === 'hat_unicorn' ? '38' : '44'}
            textAnchor="middle"
          >
            {hatItem.emoji}
          </text>
        )}

        {/* Extra item (wand, wings, etc.) */}
        {extraItem && extraItem.id !== 'extra_none' && (
          <text
            x={extraItem.id === 'extra_wings' ? '130' : '50'}
            y={extraItem.id === 'extra_wings' ? '290' : '310'}
            fontSize="32"
            textAnchor="middle"
          >
            {extraItem.emoji}
          </text>
        )}

        {/* Glasses overlay */}
        {extraItem?.id === 'extra_glasses' && (
          <>
            <text x="130" y="193" fontSize="30" textAnchor="middle">😎</text>
          </>
        )}

      </svg>
    </div>
  )
}

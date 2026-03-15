import React from 'react'
import { ACCESSORIES, SKIN_TONES, EYE_COLORS } from '../accessories.js'

function ItemButton({ item, selected, onSelect }) {
  return (
    <button
      className={`item-btn ${selected ? 'item-btn--selected' : ''}`}
      onClick={() => onSelect(item.id)}
      title={item.label}
    >
      <span className="item-emoji">{item.emoji || '✕'}</span>
      <span className="item-label">{item.label}</span>
    </button>
  )
}

function ColorSwatch({ item, selected, onSelect }) {
  const bg = item.color === 'rainbow'
    ? 'linear-gradient(135deg, #ff595e, #ffca3a, #8ac926, #1982c4, #6a4c93)'
    : item.color
  return (
    <button
      className={`swatch-btn ${selected ? 'swatch-btn--selected' : ''}`}
      onClick={() => onSelect(item.id)}
      title={item.label}
      style={{ background: bg }}
    />
  )
}

export default function AccessoryPanel({ outfit, onChange }) {
  const [activeTab, setActiveTab] = React.useState('wigs')

  const tabs = Object.keys(ACCESSORIES)

  function setItem(category, id) {
    onChange({ ...outfit, [category]: id })
  }

  return (
    <div className="panel">
      {/* Category tabs */}
      <div className="tabs">
        {tabs.map(key => (
          <button
            key={key}
            className={`tab-btn ${activeTab === key ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            <span>{ACCESSORIES[key].icon}</span>
            <span className="tab-label">{ACCESSORIES[key].label}</span>
          </button>
        ))}
        <button
          className={`tab-btn ${activeTab === 'skin' ? 'tab-btn--active' : ''}`}
          onClick={() => setActiveTab('skin')}
        >
          <span>🎨</span>
          <span className="tab-label">Skin & Eyes</span>
        </button>
      </div>

      {/* Items grid */}
      <div className="items-grid">
        {activeTab === 'skin' ? (
          <>
            <p className="section-title">Skin Tone</p>
            <div className="swatch-row">
              {SKIN_TONES.map(s => (
                <ColorSwatch
                  key={s.id}
                  item={s}
                  selected={outfit.skinTone === s.id}
                  onSelect={id => onChange({ ...outfit, skinTone: id })}
                />
              ))}
            </div>
            <p className="section-title">Eye Color</p>
            <div className="swatch-row">
              {EYE_COLORS.map(e => (
                <ColorSwatch
                  key={e.id}
                  item={e}
                  selected={outfit.eyeColor === e.id}
                  onSelect={id => onChange({ ...outfit, eyeColor: id })}
                />
              ))}
            </div>
          </>
        ) : (
          ACCESSORIES[activeTab].items.map(item => (
            <ItemButton
              key={item.id}
              item={item}
              selected={outfit[activeTab] === item.id}
              onSelect={id => setItem(activeTab, id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

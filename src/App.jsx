import React, { useState } from 'react'
import LabooBoo from './components/LabooBoo.jsx'
import AccessoryPanel from './components/AccessoryPanel.jsx'
import { defaultOutfit } from './accessories.js'
import './App.css'

const LABOOBOO_NAMES = [
  'Sparkle', 'Bubbles', 'Starshine', 'Cotton Candy', 'Rainbow',
  'Glitter', 'Blossom', 'Twinkle', 'Cupcake', 'Petal',
]

export default function App() {
  const [outfit, setOutfit] = useState(defaultOutfit)
  const [name, setName] = useState('Sparkle')
  const [editingName, setEditingName] = useState(false)
  const [inputName, setInputName] = useState('Sparkle')
  const [showConfetti, setShowConfetti] = useState(false)

  function randomName() {
    const n = LABOOBOO_NAMES[Math.floor(Math.random() * LABOOBOO_NAMES.length)]
    setName(n)
    setInputName(n)
  }

  function resetOutfit() {
    setOutfit({ ...defaultOutfit })
    triggerConfetti()
  }

  function triggerConfetti() {
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 1800)
  }

  function saveOutfit() {
    triggerConfetti()
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1 className="title">
          <span className="title-star">✨</span>
          LabooBoo Dress-Up
          <span className="title-star">✨</span>
        </h1>
        <p className="subtitle">Create your very own LabooBoo!</p>
      </header>

      <main className="main">
        {/* Character stage */}
        <div className="stage-col">
          <div className="name-badge">
            {editingName
              ? (
                <form onSubmit={e => { e.preventDefault(); setName(inputName); setEditingName(false) }}>
                  <input
                    className="name-input"
                    value={inputName}
                    onChange={e => setInputName(e.target.value)}
                    autoFocus
                    maxLength={16}
                  />
                  <button type="submit" className="name-save-btn">Save</button>
                </form>
              )
              : (
                <>
                  <span className="character-name">{name}</span>
                  <button className="name-edit-btn" onClick={() => setEditingName(true)} title="Edit name">✏️</button>
                </>
              )
            }
          </div>

          <div className="character-wrap">
            {showConfetti && <Confetti />}
            <LabooBoo outfit={outfit} />
          </div>

          <div className="stage-actions">
            <button className="btn btn--random" onClick={randomName} title="Random name">
              🎲 New Name
            </button>
            <button className="btn btn--save" onClick={saveOutfit} title="Save look">
              💾 Save Look
            </button>
            <button className="btn btn--reset" onClick={resetOutfit} title="Start over">
              🔄 Reset
            </button>
          </div>
        </div>

        {/* Accessory panel */}
        <div className="panel-col">
          <AccessoryPanel outfit={outfit} onChange={setOutfit} />
        </div>
      </main>

      <footer className="footer">
        Made with 💗 for Malia
      </footer>
    </div>
  )
}

function Confetti() {
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.8,
    color: ['#ff595e','#ffca3a','#8ac926','#1982c4','#6a4c93','#ff85a1','#a29bfe'][i % 7],
    size: 8 + Math.random() * 10,
  }))

  return (
    <div className="confetti-overlay" aria-hidden="true">
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDelay: `${p.delay}s`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  )
}

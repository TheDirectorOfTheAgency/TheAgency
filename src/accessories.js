// All LabooBoo accessory options, organized by category

export const ACCESSORIES = {
  wigs: {
    label: 'Hair & Wigs',
    icon: '💇',
    items: [
      { id: 'wig_none', label: 'No Hair', emoji: '', color: null },
      { id: 'wig_curly', label: 'Curly', emoji: '🌀', color: '#f4a261', style: 'curly' },
      { id: 'wig_straight', label: 'Straight', emoji: '〰️', color: '#e76f51', style: 'straight' },
      { id: 'wig_pigtails', label: 'Pigtails', emoji: '🎀', color: '#f7c59f', style: 'pigtails' },
      { id: 'wig_rainbow', label: 'Rainbow', emoji: '🌈', color: 'rainbow', style: 'rainbow' },
      { id: 'wig_purple', label: 'Purple Princess', emoji: '💜', color: '#b5179e', style: 'straight' },
      { id: 'wig_blue', label: 'Ocean Blue', emoji: '💙', color: '#4cc9f0', style: 'straight' },
    ],
  },
  hats: {
    label: 'Hats',
    icon: '🎩',
    items: [
      { id: 'hat_none', label: 'No Hat', emoji: '' },
      { id: 'hat_crown', label: 'Crown', emoji: '👑' },
      { id: 'hat_bow', label: 'Big Bow', emoji: '🎀' },
      { id: 'hat_party', label: 'Party Hat', emoji: '🎉' },
      { id: 'hat_flower', label: 'Flower Hat', emoji: '🌸' },
      { id: 'hat_sun', label: 'Sun Hat', emoji: '🌻' },
      { id: 'hat_baseball', label: 'Cap', emoji: '🧢' },
      { id: 'hat_witch', label: 'Witch Hat', emoji: '🧙' },
      { id: 'hat_unicorn', label: 'Unicorn Horn', emoji: '🦄' },
    ],
  },
  tops: {
    label: 'Tops & Dresses',
    icon: '👗',
    items: [
      { id: 'top_none', label: 'No Top', emoji: '', color: '#ffd6e7' },
      { id: 'top_dress_pink', label: 'Pink Dress', emoji: '👗', color: '#ff85a1' },
      { id: 'top_dress_blue', label: 'Blue Dress', emoji: '💙', color: '#74b9ff' },
      { id: 'top_dress_purple', label: 'Purple Dress', emoji: '💜', color: '#a29bfe' },
      { id: 'top_overalls', label: 'Overalls', emoji: '👖', color: '#4a90e2' },
      { id: 'top_tshirt_rainbow', label: 'Rainbow Tee', emoji: '🌈', color: 'rainbow' },
      { id: 'top_sweater', label: 'Cozy Sweater', emoji: '🧶', color: '#fd79a8' },
      { id: 'top_tutu', label: 'Tutu', emoji: '🩰', color: '#ffb3c1' },
    ],
  },
  necklaces: {
    label: 'Necklaces',
    icon: '📿',
    items: [
      { id: 'neck_none', label: 'None', emoji: '' },
      { id: 'neck_pearls', label: 'Pearls', emoji: '🫧', color: '#fff' },
      { id: 'neck_heart', label: 'Heart Locket', emoji: '❤️' },
      { id: 'neck_star', label: 'Star Chain', emoji: '⭐' },
      { id: 'neck_rainbow', label: 'Rainbow Beads', emoji: '🌈' },
      { id: 'neck_butterfly', label: 'Butterfly', emoji: '🦋' },
      { id: 'neck_flower', label: 'Flower Beads', emoji: '🌺' },
    ],
  },
  bags: {
    label: 'Purses & Bags',
    icon: '👜',
    items: [
      { id: 'bag_none', label: 'No Bag', emoji: '' },
      { id: 'bag_purse_pink', label: 'Pink Purse', emoji: '👛', color: '#ff85a1' },
      { id: 'bag_handbag', label: 'Handbag', emoji: '👜' },
      { id: 'bag_backpack', label: 'Mini Backpack', emoji: '🎒' },
      { id: 'bag_star', label: 'Star Bag', emoji: '⭐' },
      { id: 'bag_heart', label: 'Heart Bag', emoji: '💗' },
      { id: 'bag_rainbow', label: 'Rainbow Bag', emoji: '🌈' },
    ],
  },
  socks: {
    label: 'Socks & Shoes',
    icon: '🧦',
    items: [
      { id: 'socks_none', label: 'None', emoji: '' },
      { id: 'socks_rainbow', label: 'Rainbow Socks', emoji: '🌈', color: 'rainbow' },
      { id: 'socks_pink', label: 'Pink Socks', emoji: '💗', color: '#ff85a1' },
      { id: 'socks_purple', label: 'Purple Socks', emoji: '💜', color: '#a29bfe' },
      { id: 'shoes_sneakers', label: 'Sneakers', emoji: '👟' },
      { id: 'shoes_heels', label: 'Sparkle Heels', emoji: '👠' },
      { id: 'shoes_boots', label: 'Boots', emoji: '🥾' },
      { id: 'shoes_ballet', label: 'Ballet Flats', emoji: '🩰' },
    ],
  },
  makeup: {
    label: 'Makeup & Blush',
    icon: '💄',
    items: [
      { id: 'makeup_none', label: 'No Makeup', emoji: '' },
      { id: 'makeup_blush', label: 'Pink Blush', emoji: '🌸', blush: '#ffb3c6' },
      { id: 'makeup_lips_red', label: 'Red Lips', emoji: '💋', lips: '#e63946' },
      { id: 'makeup_lips_pink', label: 'Pink Lips', emoji: '🩷', lips: '#ff85a1' },
      { id: 'makeup_glitter', label: 'Glitter Cheeks', emoji: '✨', blush: '#ffd6e0', glitter: true },
      { id: 'makeup_rainbow_eyes', label: 'Rainbow Eyes', emoji: '🌈', eyes: 'rainbow' },
      { id: 'makeup_stars', label: 'Star Stickers', emoji: '⭐', stars: true },
    ],
  },
  extras: {
    label: 'Extras',
    icon: '✨',
    items: [
      { id: 'extra_none', label: 'None', emoji: '' },
      { id: 'extra_glasses', label: 'Sunglasses', emoji: '😎' },
      { id: 'extra_wings', label: 'Fairy Wings', emoji: '🧚' },
      { id: 'extra_wand', label: 'Magic Wand', emoji: '🪄' },
      { id: 'extra_flowers', label: 'Flowers', emoji: '🌺' },
      { id: 'extra_heart_balloon', label: 'Heart Balloon', emoji: '🎈' },
      { id: 'extra_sparkles', label: 'Sparkles', emoji: '✨' },
    ],
  },
}

export const SKIN_TONES = [
  { id: 'skin_1', label: 'Cream', color: '#FDDBB4' },
  { id: 'skin_2', label: 'Peach', color: '#F1C27D' },
  { id: 'skin_3', label: 'Honey', color: '#E0AC69' },
  { id: 'skin_4', label: 'Caramel', color: '#C68642' },
  { id: 'skin_5', label: 'Brown', color: '#8D5524' },
  { id: 'skin_6', label: 'Ebony', color: '#3B1F0A' },
]

export const EYE_COLORS = [
  { id: 'eye_brown', label: 'Brown', color: '#6B4423' },
  { id: 'eye_blue', label: 'Blue', color: '#4CC9F0' },
  { id: 'eye_green', label: 'Green', color: '#52B788' },
  { id: 'eye_purple', label: 'Purple', color: '#B5179E' },
  { id: 'eye_rainbow', label: 'Rainbow', color: 'rainbow' },
]

export const defaultOutfit = {
  wigs: 'wig_curly',
  hats: 'hat_none',
  tops: 'top_dress_pink',
  necklaces: 'neck_none',
  bags: 'bag_none',
  socks: 'socks_none',
  makeup: 'makeup_none',
  extras: 'extra_none',
  skinTone: 'skin_2',
  eyeColor: 'eye_brown',
}

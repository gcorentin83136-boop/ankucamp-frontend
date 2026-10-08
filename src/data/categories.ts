// ============================================================
// ANKU — Catégories prédéfinies (fallback + config admin)
// ============================================================

import {
  Store, Sprout, Wheat, Carrot, Milk, Wine,
  Beef, Fish, Cake, Coffee, Flower2, Leaf,
  Croissant, Salad, Cookie, Compass,
} from 'lucide-react'
import type { Category } from '../types/category'

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 1,  name: 'Producteurs',           slug: 'producteurs',    icon: 'sprout',    image_url: null, created_at: '' },
  { id: 2,  name: 'Fruits & Légumes',      slug: 'fruits-legumes', icon: 'carrot',    image_url: null, created_at: '' },
  { id: 3,  name: 'Épicerie fine',         slug: 'epicerie',       icon: 'wheat',     image_url: null, created_at: '' },
  { id: 4,  name: 'Fromages & Crèmerie',   slug: 'fromages',       icon: 'milk',      image_url: null, created_at: '' },
  { id: 5,  name: 'Viandes',               slug: 'viandes',        icon: 'beef',      image_url: null, created_at: '' },
  { id: 6,  name: 'Poissons',              slug: 'poissons',       icon: 'fish',      image_url: null, created_at: '' },
  { id: 7,  name: 'Boulangerie',           slug: 'boulangerie',    icon: 'croissant', image_url: null, created_at: '' },
  { id: 8,  name: 'Pâtisserie',            slug: 'patisserie',     icon: 'cake',      image_url: null, created_at: '' },
  { id: 9,  name: 'Vins & Spiritueux',     slug: 'vins',           icon: 'wine',      image_url: null, created_at: '' },
  { id: 10, name: 'Café & Thés',           slug: 'cafe',           icon: 'coffee',    image_url: null, created_at: '' },
  { id: 11, name: 'Fleurs & Plantes',      slug: 'fleurs',         icon: 'flower',    image_url: null, created_at: '' },
  { id: 12, name: 'Artisanat & Créateurs', slug: 'artisanat',      icon: 'compass',   image_url: null, created_at: '' },
]

export const ICONS_MAP: Record<string, any> = {
  sprout: Sprout, wheat: Wheat, carrot: Carrot, milk: Milk, wine: Wine,
  beef: Beef, fish: Fish, cake: Cake, coffee: Coffee, flower: Flower2,
  leaf: Leaf, croissant: Croissant, salad: Salad, cookie: Cookie,
  compass: Compass, store: Store,
}

export const GRADIENTS = [
  'linear-gradient(135deg, #6aa84f 0%, #4a7a35 100%)',
  'linear-gradient(135deg, #e67e22 0%, #c0392b 100%)',
  'linear-gradient(135deg, #3498db 0%, #2c3e50 100%)',
  'linear-gradient(135deg, #f39c12 0%, #d35400 100%)',
  'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
  'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
  'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)',
  'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)',
]

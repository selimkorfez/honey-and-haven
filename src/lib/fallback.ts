/**
 * Starter content shown until the café publishes its own content in /studio.
 * Anything published in the Studio automatically replaces the matching part below.
 * Menu and hours are taken from the café's own Instagram/TikTok stories (Oct 2026).
 * Photos are stock placeholders until the café uploads its own.
 */
import type { HomeData, MenuData, MenuItem, SanityImage, Settings, ShopItem } from './types'

const photo = (id: string, alt: string): SanityImage => ({
  alt,
  asset: { _id: 'fallback', url: `https://images.unsplash.com/photo-${id}`, metadata: { dimensions: { width: 1600, height: 1067, aspectRatio: 1.5 } } },
})

export const FALLBACK_SETTINGS: NonNullable<Settings> = {
  name: 'Honey & Haven',
  tagline: 'Coffee, matcha and a cosy haven on The Parade, Oadby.',
  address: '41D The Parade\nOadby, Leicester\nLE2 5BB',
  mapQuery: 'Honey & Haven, 41D The Parade, Oadby, Leicester LE2 5BB',
  hours: [
    { _key: 'mt', days: 'Monday – Thursday', hours: '9am – 6pm' },
    { _key: 'fs', days: 'Friday – Saturday', hours: '9am – 8pm' },
    { _key: 'su', days: 'Sunday', hours: '10am – 6pm' },
  ],
  instagram: 'https://www.instagram.com/honeyand.haven/',
  tiktok: 'https://www.tiktok.com/@honeyand.haven',
  seo: {
    title: 'Honey & Haven | Coffee & Matcha in Oadby, Leicester',
    description:
      'A cosy coffee shop on The Parade, Oadby. Spanish lattes, Vietnamese egg coffee and matcha made nine ways, plus natural honey and merch to take home. Open 7 days.',
    image: photo('1495474472287-4d71bcdd2085', 'Friends raising lattes over a wooden table'),
  },
}

const items = {
  pistachio: { _id: 'f-pistachio', name: 'Pistachio Spanish Latte', description: 'A past special from the secret menu.', image: photo('1509042239860-f550ce710b93', 'Latte with latte art'), category: 'Secret menu' },
  rose: { _id: 'f-rose', name: 'Rose Spanish Latte', description: 'A past special from the secret menu.', image: photo('1461023058943-07fcbe16d735', 'Iced latte in a tall glass'), category: 'Secret menu' },
  bueno: { _id: 'f-bueno', name: 'Kinder Bueno Spanish', description: 'A past special from the secret menu.', category: 'Secret menu' },
  popcorn: { _id: 'f-popcorn', name: 'Popcorn Matcha', description: 'A past special from the secret menu.', image: photo('1515823064-d6e0c04616a7', 'Matcha latte with latte art'), category: 'Secret menu' },
  egg: { _id: 'f-egg', name: 'Vietnamese Egg Coffee', description: 'Rich coffee topped with a silky, whipped sweet cream.', image: photo('1572442388796-11668a67e53d', 'Coffee with a thick creamy top'), category: 'Coffee' },
  matcha: { _id: 'f-matcha', name: 'Matcha Latte', description: 'Plain, or with one of nine syrups from lychee to pistachio.', category: 'Matcha' },
} satisfies Record<string, MenuItem>

export const FALLBACK_SHOP: ShopItem[] = [
  { _id: 's-honey', name: 'Natural honey', description: 'Pure, natural honey in a jar to take home. Ask at the counter.', image: photo('1558642452-9d2a7deb7f62', 'Honey dripping from a wooden dipper into a jar') },
  { _id: 's-merch', name: 'Honey & Haven merch', description: 'Our bee monogram, ready to take home. Ask at the counter to see what’s in.' },
]

export const FALLBACK_HOME: HomeData = {
  page: {
    heroHeading: 'Your little haven on The Parade',
    heroText: 'Coffee and matcha made your way, hot or iced, in a warm corner of Oadby.',
    heroSteps: [
      { _key: 's1', title: 'Every espresso, hot or iced', text: 'Lattes, flat whites, mochas and Spanish lattes, poured however you like them.' },
      { _key: 's2', title: 'Matcha, nine ways', text: 'Plain, or with vanilla, white choc, caramel, hazelnut, strawberry, coconut, blueberry, lychee or pistachio.' },
      { _key: 's3', title: 'Honey to take home', text: 'Natural honey and Honey & Haven merch, waiting at the counter.' },
    ],
    heroImage: photo('1495474472287-4d71bcdd2085', 'Friends raising lattes over a wooden table'),
    storyHeading: 'Classic comfort, with a twist',
    storyText:
      'Honey & Haven is a neighbourhood coffee shop on The Parade in Oadby: a calm, cosy spot to slow down, catch up with friends or get a little work done.\n\nAlongside the classics, we’re known for Spanish lattes, Vietnamese egg coffee and matcha made nine ways. Ask about the secret menu, where past specials like the Popcorn Matcha and the Pistachio Spanish Latte live on.',
    storyImage: photo('1442512595331-e89e73853f31', 'Barista pouring a filter coffee'),
    highlights: [
      { _key: 'h1', title: 'Hot or iced', text: 'Every espresso drink, made the way you like it.' },
      { _key: 'h2', title: 'A secret menu', text: 'Past specials you still love, available on request.' },
      { _key: 'h3', title: 'Local honey', text: 'Natural honey and merch to take home.' },
    ],
    menuHeading: 'People keep coming back for',
    menuText: 'A few favourites, including some from the secret menu.',
    shopHeading: 'Take a little haven home',
    shopText: 'Natural honey and Honey & Haven merch, available in store.',
    galleryHeading: 'Slow mornings, warm cups',
    gallery: [
      photo('1497935586351-b67a49e012bf', 'Espresso tools and coffee on a wooden board'),
      photo('1509042239860-f550ce710b93', 'Lattes among green plants'),
      photo('1453614512568-c4024d13c247', 'Bright café counter'),
      photo('1517701604599-bb29b565090c', 'Iced coffee on a wooden table'),
      photo('1558642452-9d2a7deb7f62', 'Honey dripping into a jar'),
      photo('1559496417-e7f25cb247f3', 'Small coffee in sunlight'),
    ].map((img, i) => ({ ...img, _key: `g${i}` })),
    visitHeading: 'Come say hello',
    visitText: 'Find us on The Parade in Oadby. Festive and bank holiday hours may differ.',
  },
  featured: [items.pistachio, items.rose, items.popcorn, items.egg, items.bueno, items.matcha],
  shop: FALLBACK_SHOP,
}

export const FALLBACK_MENU: MenuData = {
  page: {
    heading: 'Our menu',
    intro: 'Coffee, matcha and a secret menu of past specials. Every espresso-based drink can be made hot or iced.',
    footnote: 'Please let us know about any allergies before ordering. Festive and bank holiday hours may differ.',
  },
  categories: [
    {
      _id: 'c-coffee',
      title: 'Coffee',
      description: 'All espresso-based drinks can be hot or iced',
      items: [
        { _id: 'm-esp', name: 'Espresso' },
        { _id: 'm-ame', name: 'Americano' },
        { _id: 'm-lat', name: 'Latte' },
        { _id: 'm-cap', name: 'Cappuccino' },
        { _id: 'm-fw', name: 'Flat White' },
        { _id: 'm-mac', name: 'Macchiato' },
        { _id: 'm-moc', name: 'Mocha' },
        { _id: 'm-hc', name: 'Hot Chocolate' },
        { _id: 'm-chai', name: 'Chai Latte' },
        { _id: 'm-egg', name: 'Vietnamese Egg Coffee', description: 'Rich coffee topped with a silky, whipped sweet cream.' },
      ],
    },
    {
      _id: 'c-matcha',
      title: 'Matcha',
      items: [
        { _id: 'm-matcha', name: 'Plain Matcha Latte' },
        {
          _id: 'm-syrups',
          name: 'Add a syrup',
          priceNote: '+50p',
          description: 'Vanilla, White Choc, Caramel, Hazelnut, Strawberry, Coconut, Blueberry, Lychee, Pistachio',
        },
      ],
    },
    {
      _id: 'c-secret',
      title: 'Secret menu',
      description: 'Previous specials that you still love',
      items: [
        { _id: 'm-popcorn', name: 'Popcorn Matcha' },
        { _id: 'm-bueno', name: 'Kinder Bueno Spanish' },
        { _id: 'm-rose', name: 'Rose Spanish Latte' },
        { _id: 'm-pist', name: 'Pistachio Spanish Latte' },
      ],
    },
  ],
}

/**
 * Starter content shown until the café publishes its own content in /studio.
 * Anything published in the Studio automatically replaces the matching part below.
 * Menu and hours are taken from the café's own Instagram/TikTok stories (Oct 2026).
 * Photos are stock placeholders until the café uploads its own.
 */
import type { PortableTextBlock } from 'next-sanity'
import type { HomeData, InfoPage, MenuData, MenuItem, Product, SanityImage, Settings, ShopSettings } from './types'

const photo = (id: string, alt: string): SanityImage => ({
  alt,
  asset: { _id: 'fallback', url: `https://images.unsplash.com/photo-${id}`, metadata: { dimensions: { width: 1600, height: 1067, aspectRatio: 1.5 } } },
})

/** The café's own photos, stored in /public. */
const ownPhoto = (path: string, alt: string, w: number, h: number): SanityImage => ({
  alt,
  asset: { _id: 'fallback', url: path, metadata: { dimensions: { width: w, height: h, aspectRatio: w / h } } },
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
  hoursNote: 'Festive and bank holiday hours may differ.',
  infoPages: [
    { title: 'Delivery & returns', slug: 'delivery-and-returns' },
    { title: 'Privacy', slug: 'privacy' },
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

/** Turns plain paragraphs into rich text (the format the Studio's text editor saves). */
function blocks(...paras: (string | { h: string })[]): PortableTextBlock[] {
  return paras.map((p, i) => ({
    _type: 'block',
    _key: `b${i}`,
    style: typeof p === 'string' ? 'normal' : 'h2',
    markDefs: [],
    children: [{ _type: 'span', _key: `s${i}`, text: typeof p === 'string' ? p : p.h, marks: [] }],
  }))
}

/**
 * Example products so the owners can see how the shop works.
 * Prices are placeholders, and these can't be bought: checkout only sells products saved in the Studio.
 */
export const FALLBACK_PRODUCTS: Product[] = [
  {
    _id: 'p-honey',
    name: 'Pure Honey 340g',
    slug: 'pure-honey',
    category: 'Honey',
    images: [ownPhoto('/products/pure-honey.jpg', 'A jar of Honey & Haven Pure Honey with its cream label and gold lid', 1200, 1200)],
    summary: 'Produced as a collaboration with Tythe Bees in England’s Vale of Belvoir.',
    description: blocks(
      'Our own Pure Honey, produced as a collaboration with Tythe Bees in England’s Vale of Belvoir. Lovely in tea, on toast, or straight from the spoon.',
      '340g glass jar with a gold twist-off lid. Store at room temperature. Not suitable for babies under 12 months.',
    ),
    price: 8,
    featured: true,
  },
  {
    _id: 'p-cup',
    name: 'Honey & Haven reusable cup',
    slug: 'reusable-cup',
    category: 'Merch',
    images: [ownPhoto('/products/reusable-cup.jpg', 'Blush reusable cup with the Honey & Haven bee monogram', 800, 1000)],
    summary: 'Our bee monogram on a blush reusable cup with a sliding lid.',
    description: blocks('A blush reusable cup with a sliding drink-through lid and our bee monogram. Bring it back to the counter for your next latte.'),
    price: 15,
    featured: true,
  },
  {
    _id: 'p-tote',
    name: 'Honey & Haven tote bag',
    slug: 'tote-bag',
    category: 'Merch',
    images: [
      ownPhoto('/products/tote-front.jpg', 'Brown canvas tote bag with the cream Honey & Haven bee monogram', 960, 1200),
      ownPhoto('/products/tote-back.jpg', 'Back of the tote bag reading “If lost, return to Honey & Haven”', 960, 1200),
    ],
    summary: 'Brown canvas tote: bee monogram on the front, “If lost, return to Honey & Haven” on the back.',
    description: blocks(
      'A sturdy brown canvas tote with long handles. Our cream bee monogram is on the front, and the back reads “If lost, return to Honey & Haven”.',
      'Roomy enough for a laptop, a jar of honey and a pastry or two.',
    ),
    price: 12,
    featured: true,
  },
]

export const FALLBACK_SHOP_SETTINGS: ShopSettings = {
  heading: 'The Honey & Haven shop',
  intro: 'Natural honey and Honey & Haven merch. Order online for collection on The Parade, or have it posted anywhere in the UK.',
  ordersOpen: true,
  closedMessage: 'Online orders are paused for now. Everything is still available in store.',
  lowStockAt: 3,
  thankYouMessage: 'Thank you for supporting a little local café. We’ll be in touch by email about your order.',
  collectionEnabled: true,
  collectionNote: 'Collect from 41D The Parade, Oadby during opening hours. We’ll email you when it’s ready.',
  deliveryEnabled: true,
  deliveryFee: 3.95,
  freeDeliveryOver: 30,
  deliveryNote: 'Posted within 2 working days by Royal Mail.',
}

export const FALLBACK_INFO_PAGES: InfoPage[] = [
  {
    title: 'Delivery & returns',
    slug: 'delivery-and-returns',
    body: blocks(
      { h: 'Collect in store' },
      'Choose “Collect in store” in your basket and pick your order up from Honey & Haven, 41D The Parade, Oadby, during opening hours. We’ll email you when it’s ready.',
      { h: 'UK delivery' },
      'We post to UK addresses. The delivery cost is shown in your basket before you pay, and orders over the free-delivery amount are posted free.',
      { h: 'Changed your mind?' },
      'You can cancel an online order up to 14 days after it arrives. Let us know, send or bring the item back unused and in its original condition, and we’ll refund you within 14 days of receiving it. Return postage is paid by you unless the item was faulty. For hygiene reasons, opened food such as honey can’t be returned unless it’s faulty.',
      { h: 'Something wrong?' },
      'If anything arrives damaged or isn’t right, tell us within 30 days and we’ll replace it or refund you.',
      { h: 'Get in touch' },
      'Pop into the café or message us on Instagram, and we’ll sort it out.',
    ),
  },
  {
    title: 'Privacy',
    slug: 'privacy',
    body: blocks(
      { h: 'What we collect' },
      'When you order online we collect your name, email address, phone number and, for deliveries, your address. We use these only to prepare, deliver and contact you about your order.',
      { h: 'Payments' },
      'Payments are handled securely by Stripe. We never see or store your card details.',
      { h: 'How long we keep it' },
      'We keep order records for as long as we need them for our accounts, and we never sell your details or use them for marketing without asking.',
      { h: 'Cookies' },
      'This website doesn’t use advertising or tracking cookies. Your basket is saved in your own browser so it’s still there when you come back.',
      { h: 'Your rights' },
      'To see, correct or delete the information we hold about you, get in touch in the café or on Instagram.',
    ),
  },
]

export const FALLBACK_HOME: HomeData = {
  page: {
    heroHeading: 'Your little haven on The Parade',
    heroText: 'Coffee and matcha made your way, hot or iced, in a warm corner of Oadby.',
    heroSteps: [
      { _key: 's1', title: 'Every espresso, hot or iced', text: 'Lattes, flat whites, mochas and Spanish lattes, poured however you like them.' },
      { _key: 's2', title: 'Matcha, nine ways', text: 'Plain, or with vanilla, white choc, caramel, hazelnut, strawberry, coconut, blueberry, lychee or pistachio.' },
      { _key: 's3', title: 'Honey to take home', text: 'Our Pure Honey, made with Tythe Bees in the Vale of Belvoir, plus Honey & Haven cups and merch.' },
    ],
    heroImage: photo('1495474472287-4d71bcdd2085', 'Friends raising lattes over a wooden table'),
    storyHeading: 'Classic comfort, with a twist',
    storyText:
      'Honey & Haven is a neighbourhood coffee shop on The Parade in Oadby: a calm, cosy spot to slow down, catch up with friends or get a little work done.\n\nAlongside the classics, we’re known for Spanish lattes, Vietnamese egg coffee and matcha made nine ways. Ask about the secret menu, where past specials like the Popcorn Matcha and the Pistachio Spanish Latte live on.',
    storyImage: photo('1442512595331-e89e73853f31', 'Barista pouring a filter coffee'),
    highlights: [
      { _key: 'h1', title: 'Hot or iced', text: 'Every espresso drink, made the way you like it.' },
      { _key: 'h2', title: 'A secret menu', text: 'Past specials you still love, available on request.' },
      { _key: 'h3', title: 'Our own honey', text: 'Pure Honey made with Tythe Bees in the Vale of Belvoir.' },
    ],
    menuHeading: 'People keep coming back for',
    menuText: 'A few favourites, including some from the secret menu.',
    shopHeading: 'Take a little haven home',
    shopText: 'Natural honey and Honey & Haven merch. Order online for collection or UK delivery.',
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
    visitText: 'Find us on The Parade in Oadby. Pull up a chair, we’d love to see you.',
  },
  featured: [items.pistachio, items.rose, items.popcorn, items.egg, items.bueno, items.matcha],
  shop: FALLBACK_PRODUCTS,
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

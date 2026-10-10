/**
 * Starter content shown until the café publishes its own content in /studio.
 * Anything published in the Studio automatically replaces the matching part below.
 */
import type { HomeData, MenuData, MenuItem, SanityImage, Settings } from './types'

const photo = (id: string, alt: string): SanityImage => ({
  alt,
  asset: { _id: 'fallback', url: `https://images.unsplash.com/photo-${id}`, metadata: { dimensions: { width: 1600, height: 1067, aspectRatio: 1.5 } } },
})

export const FALLBACK_SETTINGS: NonNullable<Settings> = {
  name: 'Honey & Haven',
  tagline: 'Inventive coffee and a cosy haven on The Parade, Oadby.',
  address: '41D The Parade\nOadby, Leicester\nLE2 5BB',
  mapQuery: 'Honey & Haven, 41D The Parade, Oadby, Leicester LE2 5BB',
  hours: [
    { _key: 'wk', days: 'Monday – Friday', hours: '8:00 – 18:00' },
    { _key: 'sa', days: 'Saturday', hours: '9:00 – 18:00' },
    { _key: 'su', days: 'Sunday', hours: '10:00 – 18:00' },
  ],
  tiktok: 'https://www.tiktok.com/@honeyand.haven',
  seo: {
    title: 'Honey & Haven | Coffee Shop in Oadby, Leicester',
    description:
      'A cosy coffee shop on The Parade, Oadby. Spanish lattes, Vietnamese coffee, mango matcha, fresh paninis and homemade cakes. Open 7 days.',
    image: photo('1495474472287-4d71bcdd2085', 'Friends raising lattes over a wooden table'),
  },
}

const items = {
  spanish: { _id: 'f-spanish', name: 'Spanish latte', description: 'Espresso with sweetened condensed milk — silky, rich and lightly caramel.', price: 4.2, image: photo('1509042239860-f550ce710b93', 'Spanish latte with latte art'), category: 'Signature drinks' },
  vietnamese: { _id: 'f-viet', name: 'Vietnamese coffee', description: 'Strong black coffee served with sweet, cloudy cream on the side to stir in.', price: 4.0, image: photo('1514432324607-a09d9b4aefdd', 'Strong black coffee in a white cup'), category: 'Signature drinks' },
  mango: { _id: 'f-mango', name: 'Mango matcha', description: 'Earthy matcha layered over sweet mango.', price: 4.5, image: photo('1515823064-d6e0c04616a7', 'Matcha latte with latte art'), category: 'Signature drinks' },
  banana: { _id: 'f-banana', name: 'Banana bread iced latte', description: 'Iced espresso and milk with banana bread flavour — dessert in a glass.', price: 4.5, image: photo('1461023058943-07fcbe16d735', 'Iced latte in a tall glass'), category: 'Iced drinks' },
  panini: { _id: 'f-panini', name: 'Hummus & honey panini', description: 'Creamy hummus with a drizzle of honey, toasted until golden.', price: 6.5, dietary: ['v'], category: 'Food' },
  tiramisu: { _id: 'f-tiramisu', name: 'Tiramisu cake', description: 'Coffee-soaked sponge layered with mascarpone cream and cocoa.', price: 4.2, dietary: ['v'], image: photo('1571877227200-a0d98ea607e9', 'Slice of tiramisu cake'), category: 'Cakes & bakes' },
} satisfies Record<string, MenuItem>

export const FALLBACK_HOME: HomeData = {
  page: {
    heroEyebrow: 'Coffee shop · Oadby, Leicester',
    heroHeading: 'Your little haven on The Parade',
    heroText: 'Inventive coffee, sweet treats and a warm seat waiting — from Spanish lattes to mango matcha.',
    heroImage: photo('1495474472287-4d71bcdd2085', 'Friends raising lattes over a wooden table'),
    storyHeading: 'Classic comfort, with a twist',
    storyText:
      'Honey & Haven is a neighbourhood coffee shop on The Parade in Oadby — a calm, cosy spot to slow down, catch up with friends or get a little work done.\n\nOur menu mixes the classics you love with flavours you won’t find everywhere: Spanish lattes, banana bread iced lattes, Vietnamese coffee and mango matcha, alongside fresh paninis, croissant sandwiches and homemade cakes.',
    storyImage: photo('1442512595331-e89e73853f31', 'Barista pouring a filter coffee'),
    highlights: [
      { _key: 'h1', title: 'Inventive drinks', text: 'Spanish lattes, Vietnamese coffee, mango matcha and seasonal specials.' },
      { _key: 'h2', title: 'Fresh food & bakes', text: 'Toasted paninis, croissant sandwiches and cakes like our tiramisu.' },
      { _key: 'h3', title: 'Plant-based friendly', text: 'Vegetarian and vegan options on the menu.' },
    ],
    menuHeading: 'Our favourites',
    menuText: 'A few of the drinks and treats people keep coming back for.',
    gallery: [
      photo('1497935586351-b67a49e012bf', 'Espresso tools and coffee on a wooden board'),
      photo('1509042239860-f550ce710b93', 'Lattes among green plants'),
      photo('1453614512568-c4024d13c247', 'Bright café counter'),
      photo('1517701604599-bb29b565090c', 'Iced coffee on a wooden table'),
      photo('1555507036-ab1f4038808a', 'Fresh croissants dusted with sugar'),
      photo('1559496417-e7f25cb247f3', 'Small coffee in sunlight'),
    ].map((img, i) => ({ ...img, _key: `g${i}` })),
    visitHeading: 'Come say hello',
    visitText: 'Find us on The Parade in Oadby. Pull up a chair — card payments welcome.',
  },
  featured: [items.spanish, items.banana, items.vietnamese, items.mango, items.panini, items.tiramisu],
}

const strip = ({ category: _c, ...rest }: MenuItem) => rest as MenuItem

export const FALLBACK_MENU: MenuData = {
  page: {
    heading: 'Our menu',
    intro: 'Classic coffee, inventive specials and fresh food, made to order every day.',
    footnote: 'Please let us know about any allergies before ordering. Prices and availability may change.',
  },
  categories: [
    {
      _id: 'c-hot',
      title: 'Hot coffee',
      items: [
        { _id: 'f-esp', name: 'Espresso', price: 2.4 },
        { _id: 'f-ame', name: 'Americano', price: 2.9 },
        { _id: 'f-fw', name: 'Flat white', description: 'A double shot with silky steamed milk.', price: 3.4 },
        { _id: 'f-cap', name: 'Cappuccino', price: 3.4 },
        { _id: 'f-lat', name: 'Latte', price: 3.5 },
        { _id: 'f-hc', name: 'Hot chocolate', price: 3.5 },
      ],
    },
    { _id: 'c-sig', title: 'Signature drinks', description: 'House favourites', items: [items.spanish, items.vietnamese, items.mango].map(strip) },
    {
      _id: 'c-iced',
      title: 'Iced drinks',
      items: [items.banana, { _id: 'f-il', name: 'Iced latte', price: 3.8 }, { _id: 'f-im', name: 'Iced matcha latte', price: 4.2 }].map(strip),
    },
    {
      _id: 'c-food',
      title: 'Food',
      items: [items.panini, { _id: 'f-croi', name: 'Cheese & tomato croissant', description: 'A buttery croissant filled with melted cheese and tomato.', price: 5.5, dietary: ['v'], image: photo('1555507036-ab1f4038808a', 'Croissants') }].map(strip),
    },
    { _id: 'c-cake', title: 'Cakes & bakes', items: [items.tiramisu].map(strip) },
  ],
}

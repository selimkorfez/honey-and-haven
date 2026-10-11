const image = `{ ..., "alt": coalesce(alt, ""), asset->{ _id, url, metadata { lqip, dimensions } } }`

/** Everything a product card needs. */
const PRODUCT_BASE = `
  _id, name, "slug": slug.current, "category": category->title,
  summary, price, compareAtPrice, stock, collectionOnly, optionName,
  variants[]{ _key, name, price, stock }, featured
`
const PRODUCT_CARD = `${PRODUCT_BASE}, "images": images[0...2] ${image}`

const SHOP_SETTINGS_FIELDS = `
  heading, intro, bannerImage ${image},
  ordersOpen, closedMessage, lowStockAt, thankYouMessage,
  collectionEnabled, collectionNote,
  deliveryEnabled, deliveryFee, freeDeliveryOver, deliveryNote,
  seo { title, description, image ${image}, noIndex }
`

export const SETTINGS_QUERY = `*[_id == "siteSettings"][0]{
  name, tagline, announcement, address, mapQuery, phone, email,
  hours[]{ _key, days, hours }, hoursNote,
  specialHours[]{ _key, label, date, endDate, closed, hours },
  "infoPages": *[_type == "policyPage" && showInFooter != false && defined(slug.current)] | order(order asc){ title, "slug": slug.current },
  instagram, tiktok, facebook,
  seo { title, description, image ${image}, noIndex }
}`

export const HOME_QUERY = `{
  "page": *[_id == "homePage"][0]{
    heroHeading, heroText, heroSteps[]{ _key, title, text }, heroImage ${image},
    storyHeading, storyText, storyImage ${image},
    highlights[]{ _key, title, text },
    menuHeading, menuText, shopHeading, shopText,
    galleryHeading, gallery[] ${image},
    visitHeading, visitText,
    seo { title, description, image ${image}, noIndex }
  },
  "featured": *[_type == "menuItem" && featured == true && available != false] | order(order asc)[0...6]{
    _id, name, description, price, priceNote, dietary, image ${image}, "category": category->title
  },
  "shop": *[_type == "product" && featured == true && available != false && defined(slug.current)] | order(order asc)[0...4]{ ${PRODUCT_CARD} }
}`

export const MENU_QUERY = `{
  "page": *[_id == "menuPage"][0]{ heading, intro, footnote, seo { title, description, image ${image}, noIndex } },
  "categories": *[_type == "menuCategory"] | order(order asc){
    _id, title, description,
    "items": *[_type == "menuItem" && references(^._id) && available != false] | order(order asc){
      _id, name, description, price, priceNote, dietary, image ${image}
    }
  }[count(items) > 0]
}`

export const SHOP_SETTINGS_QUERY = `*[_id == "shopPage"][0]{ ${SHOP_SETTINGS_FIELDS} }`

export const SHOP_QUERY = `{
  "settings": *[_id == "shopPage"][0]{ ${SHOP_SETTINGS_FIELDS} },
  "categories": *[_type == "productCategory" && count(*[_type == "product" && references(^._id) && available != false]) > 0] | order(order asc).title,
  "products": *[_type == "product" && available != false && defined(slug.current)] | order(order asc){ ${PRODUCT_CARD} }
}`

export const PRODUCT_QUERY = `{
  "product": *[_type == "product" && slug.current == $slug && available != false][0]{
    ${PRODUCT_BASE}, "images": images[] ${image}, description
  },
  "related": *[_type == "product" && slug.current != $slug && available != false && defined(slug.current)] | order(featured desc, order asc)[0...3]{ ${PRODUCT_CARD} }
}`

export const PRODUCT_SLUGS_QUERY = `*[_type == "product" && available != false && defined(slug.current)].slug.current`

/** Used at checkout: always fresh (no CDN), never trusted from the browser. */
export const CHECKOUT_PRODUCTS_QUERY = `*[_type == "product" && _id in $ids]{
  _id, name, available, price, stock, collectionOnly,
  variants[]{ _key, name, price, stock },
  "imageUrl": images[0].asset->url
}`

export const INFO_PAGE_QUERY = `*[_type == "policyPage" && slug.current == $slug][0]{ title, "slug": slug.current, body }`

export const INFO_SLUGS_QUERY = `*[_type == "policyPage" && defined(slug.current)].slug.current`

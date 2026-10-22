const image = `{ ..., "alt": coalesce(alt, ""), asset->{ _id, url, metadata { lqip, dimensions } } }`

/** Everything a product card needs. */
const PRODUCT_BASE = `
  _id, name, "slug": slug.current, "category": category->title,
  summary, price, compareAtPrice, stock, collectionOnly, optionName,
  variants[]{ _key, name, price, stock }, featured, comingSoon
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
  name, tagline, announcement, "announcementLink": announcementLink{ page, url, "section": menuSection->title }, address, mapQuery, phone, email,
  season{ theme, decoration, barStyle, message, start, end },
  hours[]{ _key, days, hours }, hoursNote,
  specialHours[]{ _key, label, date, endDate, closed, hours },
  "infoPages": *[_type == "policyPage" && showInFooter != false && defined(slug.current)] | order(order asc){ title, "slug": slug.current },
  instagram, tiktok, facebook,
  "hasBlog": count(*[_type == "post" && defined(slug.current) && publishedAt <= now()]) > 0,
  beeEnabled, beeGreeting, beePicks[]{ _key, title, text, link },
  googlePlaceId, reviewLink,
  newsletter { enabled, popup, popupDelay, popupHeading, popupText, heading, text, offer, button, thanks },
  seo { title, description, image ${image}, noIndex }
}`

export const HOME_QUERY = `{
  "page": *[_id == "homePage"][0]{
    heroHeading, heroText, heroSteps[]{ _key, title, text }, heroImage ${image}, heroTone,
    storyHeading, storyText, storyImage ${image},
    highlights[]{ _key, title, text },
    menuHeading, menuText, shopHeading, shopText,
    reviewsHeading, reviewsText, handpickedReviews[]{ _key, quote, name, rating, source, link },
    visitHeading, visitText,
    seo { title, description, image ${image}, noIndex }
  },
  "gallery": *[_id == "galleryPage"][0]{ heading, text, show, photos[] ${image} },
  "featured": *[_type == "menuItem" && featured == true && available != false] | order(orderRank asc)[0...6]{
    _id, name, description, price, priceNote, dietary, comingSoon, image ${image}, "category": category->title
  },
  "shop": *[_type == "product" && featured == true && available != false && defined(slug.current)] | order(orderRank asc)[0...6]{ ${PRODUCT_CARD} }
}`

export const MENU_QUERY = `{
  "page": *[_id == "menuPage"][0]{ heading, intro, drinksNote, footnote, milkLabel, milks[]{ _key, name, dietary }, seo { title, description, image ${image}, noIndex } },
  "categories": *[_type == "menuCategory"] | order(orderRank asc){
    _id, title, description, showMilks,
    "items": *[_type == "menuItem" && references(^._id) && available != false] | order(orderRank asc){
      _id, name, description, price, priceNote, dietary, comingSoon, image ${image}
    }
  }[count(items) > 0]
}`

export const SHOP_SETTINGS_QUERY = `*[_id == "shopPage"][0]{ ${SHOP_SETTINGS_FIELDS} }`

export const SHOP_QUERY = `{
  "settings": *[_id == "shopPage"][0]{ ${SHOP_SETTINGS_FIELDS} },
  "categories": *[_type == "productCategory" && count(*[_type == "product" && references(^._id) && available != false]) > 0] | order(orderRank asc).title,
  "products": *[_type == "product" && available != false && defined(slug.current)] | order(orderRank asc){ ${PRODUCT_CARD} }
}`

export const PRODUCT_QUERY = `{
  "product": *[_type == "product" && slug.current == $slug && available != false][0]{
    ${PRODUCT_BASE}, "images": images[] ${image}, description
  },
  "related": *[_type == "product" && slug.current != $slug && available != false && defined(slug.current)] | order(featured desc, orderRank asc)[0...3]{ ${PRODUCT_CARD} }
}`

export const PRODUCT_SLUGS_QUERY = `*[_type == "product" && available != false && defined(slug.current)].slug.current`

/** Used at checkout: always fresh (no CDN), never trusted from the browser. */
export const CHECKOUT_PRODUCTS_QUERY = `*[_type == "product" && _id in $ids]{
  _id, name, available, comingSoon, price, stock, collectionOnly,
  variants[]{ _key, name, price, stock },
  "imageUrl": images[0].asset->url
}`

export const INFO_PAGE_QUERY = `*[_type == "policyPage" && slug.current == $slug][0]{ title, "slug": slug.current, body }`

export const INFO_SLUGS_QUERY = `*[_type == "policyPage" && defined(slug.current)].slug.current`

export const ABOUT_QUERY = `*[_id == "aboutPage"][0]{
  heading, intro, heroImage ${image},
  storyHeading, story, storyImage ${image},
  values[]{ _key, title, text },
  teamHeading, teamIntro,
  team[]{ _key, name, role, photo ${image}, bio, favourite },
  visitHeading, visitText,
  seo { title, description, image ${image}, noIndex }
}`

const POST_CARD = `_id, title, "slug": slug.current, publishedAt, category, excerpt, coverImage ${image}`

export const POSTS_QUERY = `*[_type == "post" && defined(slug.current) && publishedAt <= now()] | order(publishedAt desc)[0...48]{ ${POST_CARD} }`

export const POST_QUERY = `{
  "post": *[_type == "post" && slug.current == $slug][0]{
    ${POST_CARD}, author,
    body[]{ ..., _type == "inlineImage" => { ..., "alt": coalesce(alt, ""), asset->{ _id, url, metadata { lqip, dimensions } } } },
    seo { title, description, image ${image}, noIndex }
  },
  "more": *[_type == "post" && defined(slug.current) && slug.current != $slug && publishedAt <= now()] | order(publishedAt desc)[0...3]{ ${POST_CARD} }
}`

export const POST_SLUGS_QUERY = `*[_type == "post" && defined(slug.current) && publishedAt <= now()].slug.current`

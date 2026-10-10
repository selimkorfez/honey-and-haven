const image = `{ ..., "alt": coalesce(alt, ""), asset->{ _id, url, metadata { lqip, dimensions } } }`

export const SETTINGS_QUERY = `*[_id == "siteSettings"][0]{
  name, tagline, announcement, address, mapQuery, phone, email,
  hours[]{ _key, days, hours },
  instagram, tiktok, facebook,
  seo { title, description, image ${image}, noIndex }
}`

export const HOME_QUERY = `{
  "page": *[_id == "homePage"][0]{
    heroEyebrow, heroHeading, heroText, heroImage ${image},
    storyHeading, storyText, storyImage ${image},
    highlights[]{ _key, title, text },
    menuHeading, menuText,
    gallery[] ${image},
    visitHeading, visitText,
    seo { title, description, image ${image}, noIndex }
  },
  "featured": *[_type == "menuItem" && featured == true && available != false] | order(order asc)[0...6]{
    _id, name, description, price, priceNote, dietary, image ${image}, "category": category->title
  }
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

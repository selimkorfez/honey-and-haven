import { defineLocations, type PresentationPluginOptions } from 'sanity/presentation'

/** Which page of the website each kind of content appears on (used by the Preview tab). */
export const resolve: PresentationPluginOptions['resolve'] = {
  locations: {
    post: defineLocations({
      select: { title: 'title', slug: 'slug.current' },
      resolve: (doc) => ({
        locations: [
          ...(doc?.slug ? [{ title: doc.title || 'Post', href: `/blog/${doc.slug}` }] : []),
          { title: 'Blog', href: '/blog' },
        ],
      }),
    }),
    product: defineLocations({
      select: { title: 'name', slug: 'slug.current' },
      resolve: (doc) => ({
        locations: [
          ...(doc?.slug ? [{ title: doc.title || 'Product', href: `/shop/${doc.slug}` }] : []),
          { title: 'Shop', href: '/shop' },
        ],
      }),
    }),
    menuItem: defineLocations({ locations: [{ title: 'Menu', href: '/menu' }, { title: 'Home page', href: '/' }] }),
    menuCategory: defineLocations({ locations: [{ title: 'Menu', href: '/menu' }] }),
    menuPage: defineLocations({ locations: [{ title: 'Menu', href: '/menu' }] }),
    homePage: defineLocations({ locations: [{ title: 'Home page', href: '/' }] }),
    galleryPage: defineLocations({ locations: [{ title: 'Home page', href: '/#instagram' }] }),
    aboutPage: defineLocations({ locations: [{ title: 'About us', href: '/about' }] }),
    shopPage: defineLocations({ locations: [{ title: 'Shop', href: '/shop' }] }),
    productCategory: defineLocations({ locations: [{ title: 'Shop', href: '/shop' }] }),
    siteSettings: defineLocations({ locations: [{ title: 'Home page', href: '/' }, { title: 'About us', href: '/about' }] }),
    policyPage: defineLocations({
      select: { title: 'title', slug: 'slug.current' },
      resolve: (doc) => ({ locations: doc?.slug ? [{ title: doc.title || 'Info page', href: `/info/${doc.slug}` }] : [] }),
    }),
  },
}

import { seo } from './seo'
import { openingHours } from './openingHours'
import { specialHours } from './specialHours'
import { siteSettings } from './siteSettings'
import { homePage } from './homePage'
import { menuPage } from './menuPage'
import { menuCategory } from './menuCategory'
import { menuItem } from './menuItem'
import { shopPage } from './shopPage'
import { productCategory } from './productCategory'
import { product } from './product'
import { order } from './order'
import { policyPage } from './policyPage'
import { aboutPage } from './aboutPage'
import { feedback } from './feedback'
import { discountCode } from './discountCode'

export const schemaTypes = [
  seo,
  openingHours,
  specialHours,
  siteSettings,
  homePage,
  menuPage,
  menuCategory,
  menuItem,
  shopPage,
  productCategory,
  product,
  order,
  policyPage,
  aboutPage,
  feedback,
  discountCode,
]

export const singletonTypes = new Set(['siteSettings', 'homePage', 'menuPage', 'shopPage', 'aboutPage'])

/** Created automatically by the website; staff can't add these by hand. */
export const systemTypes = new Set(['order', 'feedback'])

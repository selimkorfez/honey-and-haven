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
]

export const singletonTypes = new Set(['siteSettings', 'homePage', 'menuPage', 'shopPage'])

/** Created automatically by the website; staff can't add these by hand. */
export const systemTypes = new Set(['order'])

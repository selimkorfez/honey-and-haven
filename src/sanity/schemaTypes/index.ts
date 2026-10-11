import { seo } from './seo'
import { openingHours } from './openingHours'
import { siteSettings } from './siteSettings'
import { homePage } from './homePage'
import { menuPage } from './menuPage'
import { menuCategory } from './menuCategory'
import { menuItem } from './menuItem'
import { shopItem } from './shopItem'

export const schemaTypes = [seo, openingHours, siteSettings, homePage, menuPage, menuCategory, menuItem, shopItem]

export const singletonTypes = new Set(['siteSettings', 'homePage', 'menuPage'])

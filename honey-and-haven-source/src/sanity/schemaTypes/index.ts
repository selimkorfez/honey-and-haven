import { seo } from './seo'
import { openingHours } from './openingHours'
import { siteSettings } from './siteSettings'
import { homePage } from './homePage'
import { menuPage } from './menuPage'
import { menuCategory } from './menuCategory'
import { menuItem } from './menuItem'

export const schemaTypes = [seo, openingHours, siteSettings, homePage, menuPage, menuCategory, menuItem]

export const singletonTypes = new Set(['siteSettings', 'homePage', 'menuPage'])

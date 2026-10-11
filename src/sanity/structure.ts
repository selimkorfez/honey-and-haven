import type { StructureResolver } from 'sanity/structure'
import { CogIcon } from '@sanity/icons/Cog'
import { HomeIcon } from '@sanity/icons/Home'
import { DocumentTextIcon } from '@sanity/icons/DocumentText'
import { BillIcon } from '@sanity/icons/Bill'
import { TagIcon } from '@sanity/icons/Tag'
import { TagsIcon } from '@sanity/icons/Tags'
import { StarIcon } from '@sanity/icons/Star'
import { BasketIcon } from '@sanity/icons/Basket'
import { PackageIcon } from '@sanity/icons/Package'
import { InboxIcon } from '@sanity/icons/Inbox'
import { CheckmarkCircleIcon } from '@sanity/icons/CheckmarkCircle'
import { WarningOutlineIcon } from '@sanity/icons/WarningOutline'
import { PinIcon } from '@sanity/icons/Pin'
import { ArchiveIcon } from '@sanity/icons/Archive'
import { DocumentsIcon } from '@sanity/icons/Documents'

const newestFirst = [{ field: 'placedAt', direction: 'desc' as const }]

export const structure: StructureResolver = (S) => {
  const orderList = (title: string, filter: string) =>
    S.documentList().title(title).schemaType('order').filter(filter).defaultOrdering(newestFirst).initialValueTemplates([])

  return S.list()
    .title('Honey & Haven')
    .items([
      // ---------- Orders (most-used, so first) ----------
      S.listItem()
        .title('Orders')
        .icon(PackageIcon)
        .child(
          S.list()
            .title('Orders')
            .items([
              S.listItem().title('To prepare').icon(InboxIcon).child(orderList('To prepare', '_type == "order" && (!defined(status) || status == "new")')),
              S.listItem().title('Ready to collect').icon(BasketIcon).child(orderList('Ready to collect', '_type == "order" && status == "ready"')),
              S.listItem().title('Posted').icon(PackageIcon).child(orderList('Posted', '_type == "order" && status == "posted"')),
              S.listItem().title('Done').icon(CheckmarkCircleIcon).child(orderList('Done', '_type == "order" && status in ["done", "cancelled"]')),
              S.divider(),
              S.listItem().title('All orders').icon(ArchiveIcon).child(orderList('All orders', '_type == "order"')),
            ]),
        ),

      // ---------- Shop ----------
      S.listItem()
        .title('Shop')
        .icon(BasketIcon)
        .child(
          S.list()
            .title('Shop')
            .items([
              S.listItem()
                .title('All products')
                .icon(BasketIcon)
                .child(S.documentTypeList('product').title('All products').defaultOrdering([{ field: 'order', direction: 'asc' }])),
              S.listItem()
                .title('Pinned to home page')
                .icon(PinIcon)
                .child(S.documentList().title('Pinned').schemaType('product').filter('_type == "product" && featured == true')),
              S.listItem()
                .title('Low stock (3 or fewer)')
                .icon(WarningOutlineIcon)
                .child(
                  S.documentList()
                    .title('Low stock & sold out')
                    .schemaType('product')
                    .filter(
                      '_type == "product" && (stock <= 3 || count(variants[stock <= 3]) > 0)',
                    )
                    .defaultOrdering([{ field: 'stock', direction: 'asc' }]),
                ),
              S.listItem()
                .title('Categories')
                .icon(TagsIcon)
                .child(S.documentTypeList('productCategory').title('Shop categories').defaultOrdering([{ field: 'order', direction: 'asc' }])),
              S.divider(),
              S.listItem()
                .title('Shop settings')
                .icon(CogIcon)
                .child(S.document().schemaType('shopPage').documentId('shopPage').title('Shop settings')),
            ]),
        ),
      S.divider(),

      // ---------- Pages ----------
      S.listItem()
        .title('Home page')
        .icon(HomeIcon)
        .child(S.document().schemaType('homePage').documentId('homePage').title('Home page')),
      S.listItem()
        .title('Menu page')
        .icon(DocumentTextIcon)
        .child(S.document().schemaType('menuPage').documentId('menuPage').title('Menu page')),
      S.listItem()
        .title('Info pages')
        .icon(DocumentsIcon)
        .child(S.documentTypeList('policyPage').title('Info pages').defaultOrdering([{ field: 'order', direction: 'asc' }])),
      S.divider(),

      // ---------- Café menu ----------
      S.listItem()
        .title('Menu items')
        .icon(BillIcon)
        .child(
          S.list()
            .title('Menu items')
            .items([
              S.listItem()
                .title('All items')
                .icon(BillIcon)
                .child(S.documentTypeList('menuItem').title('All items').defaultOrdering([{ field: 'order', direction: 'asc' }])),
              S.listItem()
                .title('Featured on home page')
                .icon(StarIcon)
                .child(S.documentList().title('Featured').schemaType('menuItem').filter('_type == "menuItem" && featured == true')),
              S.listItem()
                .title('By category')
                .icon(TagIcon)
                .child(
                  S.documentTypeList('menuCategory')
                    .title('Pick a category')
                    .defaultOrdering([{ field: 'order', direction: 'asc' }])
                    .child((categoryId) =>
                      S.documentList()
                        .title('Items')
                        .schemaType('menuItem')
                        .filter('_type == "menuItem" && category._ref == $categoryId')
                        .params({ categoryId })
                        .defaultOrdering([{ field: 'order', direction: 'asc' }])
                        .initialValueTemplates([]),
                    ),
                ),
            ]),
        ),
      S.listItem()
        .title('Menu categories')
        .icon(TagIcon)
        .child(S.documentTypeList('menuCategory').title('Menu categories').defaultOrdering([{ field: 'order', direction: 'asc' }])),
      S.divider(),
      S.listItem()
        .title('Site settings')
        .icon(CogIcon)
        .child(S.document().schemaType('siteSettings').documentId('siteSettings').title('Site settings')),
    ])
}

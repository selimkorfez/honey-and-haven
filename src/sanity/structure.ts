import type { ComponentType } from 'react'
import type { StructureResolver } from 'sanity/structure'
import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list'
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
import { CommentIcon } from '@sanity/icons/Comment'
import { UsersIcon } from '@sanity/icons/Users'
import { ComposeIcon } from '@sanity/icons/Compose'
import { ImagesIcon } from '@sanity/icons/Images'
import { EditIcon } from '@sanity/icons/Edit'

/** The Owner is a Sanity "Administrator". Staff (Editor/Contributor) don't see owner-only sections. */
export const isOwner = (user: { roles?: { name: string }[] } | null | undefined) => Boolean(user?.roles?.some((r) => r.name === 'administrator'))

const newestFirst = [{ field: 'placedAt', direction: 'desc' as const }]

export const structure: StructureResolver = (S, context) => {
  const owner = isOwner(context.currentUser)
  const singleton = (title: string, type: string, icon: ComponentType) =>
    S.listItem().title(title).icon(icon).id(type).child(S.document().schemaType(type).documentId(type).title(title))

  const orderList = (title: string, filter: string) =>
    S.documentList().title(title).schemaType('order').filter(filter).defaultOrdering(newestFirst).initialValueTemplates([])
  const noteList = (title: string, filter: string) =>
    S.documentList().title(title).schemaType('feedback').filter(filter).defaultOrdering([{ field: 'sentAt', direction: 'desc' }]).initialValueTemplates([])

  return S.list()
    .title('Honey & Haven')
    .items([
      // ---------- Day to day ----------
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
      S.listItem()
        .title('Inbox (customer notes)')
        .icon(CommentIcon)
        .child(
          S.list()
            .title('Customer notes')
            .items([
              S.listItem().title('New').icon(InboxIcon).child(noteList('New notes', '_type == "feedback" && (!defined(status) || status == "new")')),
              S.listItem().title('Read').icon(CommentIcon).child(noteList('Read', '_type == "feedback" && status == "read"')),
              S.listItem().title('Done').icon(CheckmarkCircleIcon).child(noteList('Done', '_type == "feedback" && status == "done"')),
              S.divider(),
              S.listItem().title('All notes').icon(ArchiveIcon).child(noteList('All notes', '_type == "feedback"')),
            ]),
        ),
      S.divider(),

      // ---------- Blog ----------
      S.listItem()
        .title('Blog')
        .icon(ComposeIcon)
        .child(
          S.list()
            .title('Blog')
            .items([
              S.listItem()
                .title('All posts')
                .icon(ComposeIcon)
                .child(S.documentTypeList('post').title('All posts').defaultOrdering([{ field: 'publishedAt', direction: 'desc' }])),
              S.listItem()
                .title('Drafts (not on the website yet)')
                .icon(EditIcon)
                .child(
                  S.documentList()
                    .title('Drafts')
                    .schemaType('post')
                    .filter('_type == "post" && _id in path("drafts.**")')
                    .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }]),
                ),
            ]),
        ),

      // ---------- Menu ----------
      S.listItem()
        .title('Menu')
        .icon(BillIcon)
        .child(
          S.list()
            .title('Menu')
            .items([
              orderableDocumentListDeskItem({ type: 'menuItem', title: 'Menu items (drag to reorder)', id: 'orderable-menu-items', icon: BillIcon, S, context }),
              orderableDocumentListDeskItem({ type: 'menuCategory', title: 'Categories (drag to reorder)', id: 'orderable-menu-categories', icon: TagIcon, S, context }),
              S.listItem()
                .title('Featured on home page')
                .icon(StarIcon)
                .child(S.documentList().title('Featured').schemaType('menuItem').filter('_type == "menuItem" && featured == true')),
              S.listItem()
                .title('Hidden items')
                .icon(WarningOutlineIcon)
                .child(S.documentList().title('Hidden items').schemaType('menuItem').filter('_type == "menuItem" && available == false')),
              S.listItem()
                .title('By category')
                .icon(TagsIcon)
                .child(
                  S.documentTypeList('menuCategory')
                    .title('Pick a category')
                    .child((categoryId) =>
                      S.documentList()
                        .title('Items')
                        .schemaType('menuItem')
                        .filter('_type == "menuItem" && category._ref == $categoryId')
                        .params({ categoryId })
                        .defaultOrdering([{ field: 'orderRank', direction: 'asc' }]),
                    ),
                ),
              S.divider(),
              singleton('Menu page text', 'menuPage', DocumentTextIcon),
            ]),
        ),

      // ---------- Shop ----------
      S.listItem()
        .title('Shop / Merchandise')
        .icon(BasketIcon)
        .child(
          S.list()
            .title('Shop / Merchandise')
            .items([
              orderableDocumentListDeskItem({ type: 'product', title: 'Products (drag to reorder)', id: 'orderable-products', icon: BasketIcon, S, context }),
              orderableDocumentListDeskItem({ type: 'productCategory', title: 'Categories (drag to reorder)', id: 'orderable-product-categories', icon: TagsIcon, S, context }),
              S.listItem()
                .title('Pinned to home page')
                .icon(PinIcon)
                .child(S.documentList().title('Pinned').schemaType('product').filter('_type == "product" && featured == true')),
              S.listItem()
                .title('Low stock & sold out')
                .icon(WarningOutlineIcon)
                .child(
                  S.documentList()
                    .title('Low stock & sold out')
                    .schemaType('product')
                    .filter('_type == "product" && (stock <= 3 || count(variants[stock <= 3]) > 0)')
                    .defaultOrdering([{ field: 'stock', direction: 'asc' }]),
                ),
              S.listItem()
                .title('Hidden products')
                .icon(ArchiveIcon)
                .child(S.documentList().title('Hidden products').schemaType('product').filter('_type == "product" && available == false')),
              S.listItem().title('Discount codes').icon(TagIcon).child(S.documentTypeList('discountCode').title('Discount codes')),
              ...(owner ? [S.divider(), singleton('Shop settings (payments & delivery)', 'shopPage', CogIcon)] : []),
            ]),
        ),

      // ---------- Gallery ----------
      singleton('Gallery', 'galleryPage', ImagesIcon),

      // ---------- Homepage & other pages ----------
      singleton('Homepage', 'homePage', HomeIcon),
      S.listItem()
        .title('Other pages')
        .icon(DocumentsIcon)
        .child(
          S.list()
            .title('Other pages')
            .items([
              singleton('About us', 'aboutPage', UsersIcon),
              S.listItem()
                .title('Info pages (delivery, privacy…)')
                .icon(DocumentsIcon)
                .child(S.documentTypeList('policyPage').title('Info pages').defaultOrdering([{ field: 'order', direction: 'asc' }])),
            ]),
        ),

      // ---------- Owner only ----------
      ...(owner ? [S.divider(), singleton('Site settings', 'siteSettings', CogIcon)] : []),
    ])
}

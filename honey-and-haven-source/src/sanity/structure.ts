import type { StructureResolver } from 'sanity/structure'
import { CogIcon } from '@sanity/icons/Cog'
import { HomeIcon } from '@sanity/icons/Home'
import { DocumentTextIcon } from '@sanity/icons/DocumentText'
import { BillIcon } from '@sanity/icons/Bill'
import { TagIcon } from '@sanity/icons/Tag'
import { StarIcon } from '@sanity/icons/Star'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Honey & Haven')
    .items([
      S.listItem()
        .title('Home page')
        .icon(HomeIcon)
        .child(S.document().schemaType('homePage').documentId('homePage').title('Home page')),
      S.listItem()
        .title('Menu page')
        .icon(DocumentTextIcon)
        .child(S.document().schemaType('menuPage').documentId('menuPage').title('Menu page')),
      S.divider(),
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
                .child(S.documentList().title('Featured').filter('_type == "menuItem" && featured == true')),
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

'use client'

import { Button, Flex, Text } from '@sanity/ui'
import { DownloadIcon } from '@sanity/icons/Download'
import { DocumentPdfIcon } from '@sanity/icons/DocumentPdf'
import { useFormValue } from 'sanity'

/** On an order in the Studio: open or download its PDF receipt (the same one the customer got). */
export function ReceiptLink() {
  const ref = useFormValue(['orderNumber']) as string | undefined
  const key = useFormValue(['receiptKey']) as string | undefined
  if (!ref || !key) {
    return (
      <Text size={1} muted>
        No receipt for this order (it was placed before receipts were added).
      </Text>
    )
  }
  const url = `/api/receipt/${ref}?k=${key}`
  return (
    <Flex gap={2} wrap="wrap">
      <Button as="a" href={url} target="_blank" rel="noopener noreferrer" icon={DocumentPdfIcon} text="Open receipt" mode="ghost" />
      <Button as="a" href={`${url}&download=1`} icon={DownloadIcon} text="Download PDF" mode="ghost" />
    </Flex>
  )
}

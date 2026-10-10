type Props = {
  as?: 'div' | 'li' | 'article' | 'section' | 'span'
  variant?: 'up' | 'left' | 'right' | 'zoom' | 'fade' | 'curtain'
  delay?: number
  className?: string
  children: React.ReactNode
  style?: React.CSSProperties
}

/** Wrap anything to have it animate in as it scrolls into view. */
export function Reveal({ as: Tag = 'div', variant = 'up', delay = 0, className = '', children, style }: Props) {
  return (
    <Tag
      className={`reveal ${className}`.trim()}
      data-reveal={variant}
      style={{ ...style, ['--d' as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  )
}

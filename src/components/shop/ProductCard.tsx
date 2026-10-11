import Link from 'next/link'
import type { ProductCardView } from '@/lib/productView'
import { Img } from '../Img'
import { LogoMark } from '../LogoMark'
import { QuickAdd } from './QuickAdd'

export function ProductCard({ p }: { p: ProductCardView }) {
  return (
    <article className="pcard" data-soldout={p.soldOut || undefined}>
      <div className="pcard-media" data-tone={p.tone}>
        {p.image ? <Img img={p.image} /> : <LogoMark className="pcard-mark" />}
        {p.image2 ? <Img img={p.image2} className="pcard-alt" /> : null}
        {p.badge ? (
          <span className="pcard-badge" data-kind={p.soldOut ? 'out' : p.badge === 'Sale' ? 'sale' : 'low'}>
            {p.badge}
          </span>
        ) : null}
      </div>
      <div className="pcard-body">
        <div className="pcard-text">
          {p.category ? <p className="pcard-cat">{p.category}</p> : null}
          <h3>
            <Link href={`/shop/${p.slug}`} className="pcard-link">
              {p.name}
            </Link>
          </h3>
          <p className="pcard-price">
            <span className="price">{p.price}</span>
            {p.was ? (
              <s className="price">
                <span className="sr-only">was </span>
                {p.was}
              </s>
            ) : null}
          </p>
        </div>
        {p.quickAdd ? <QuickAdd item={p.quickAdd} /> : !p.soldOut ? <span className="pcard-choose">Choose</span> : null}
      </div>
    </article>
  )
}

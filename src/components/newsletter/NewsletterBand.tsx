'use client'

import type { NewsletterSettings } from '@/lib/types'
import { BeeMark } from '../bee/BeeMark'
import { NewsletterForm, useLetterState } from './NewsletterForm'

/** "Stay in the hive": the signup that sits just above the footer on every page. */
export function NewsletterBand({ settings }: { settings: NewsletterSettings }) {
  const state = useLetterState()
  const done = state?.status === 'pending' || state?.status === 'joined'

  return (
    <section className="letter-band" id="newsletter" aria-labelledby="letter-band-title">
      <div className="container letter-band-inner">
        <div className="letter-band-copy">
          <p className="eyebrow">The Honey &amp; Haven letter</p>
          <h2 id="letter-band-title">{settings.heading}</h2>
          <p className="body-text">{settings.text}</p>
        </div>
        <div className="letter-band-form">
          {done ? (
            <div className="letter-done" role="status">
              <BeeMark className="letter-done-mark" />
              <div>
                <h3>{state?.status === 'joined' ? 'You’re in the hive' : 'Almost there'}</h3>
                <p>
                  {state?.status === 'joined'
                    ? 'Thanks for joining. Look out for your welcome email with your discount code.'
                    : settings.thanks}
                </p>
              </div>
            </div>
          ) : (
            <NewsletterForm settings={settings} variant="band" source="footer" />
          )}
        </div>
      </div>
    </section>
  )
}

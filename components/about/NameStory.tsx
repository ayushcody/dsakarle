/**
 * "Why 'Karle'?": a short card explaining the name. Tokens only, so it follows the theme.
 * Drop it into the About page, e.g. right under the intro header.
 */
export function NameStory({ className }: { className?: string }) {
  return (
    <aside
      aria-labelledby="name-story-title"
      className={['rounded-card border border-rule bg-paper-raised p-5 sm:p-6', className].filter(Boolean).join(' ')}
    >
      <h2 id="name-story-title" className="t-h3 text-ink">
        Why &ldquo;<span className="text-coral-ink">Karle</span>&rdquo;?
      </h2>
      <p className="mt-3 max-w-[68ch] text-[16px] leading-7 text-ink-2">
        <span className="font-semibold text-ink">Karle</span> (kar-lay) is Hindi for &ldquo;do it.&rdquo; It is
        the nudge you give a friend who has been putting something off. This site is built around the doing:
        you predict the next step before it happens, step through a real run yourself, and try your own
        input. Reading about an algorithm is the easy part; <em>DSA, karle.</em>
      </p>
    </aside>
  )
}

export default NameStory

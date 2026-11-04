/**
 * Geometry of the DSA Karle mark, in a 32x32 viewBox. Shared by the React `LogoMark`, the favicon,
 * the Apple touch icon and the social image so they can never drift apart.
 *
 * Two coral brackets frame an array. Two cells sit still; the third, filled and lifted half a cell, is
 * the window mid-slide. Stroke weights are heavier than a hairline on purpose: the mark has to hold up at 16px.
 */
export const MARK = {
  bracketStroke: 2.7,
  cellStroke: 1.7,
  brackets: [
    'M9.2 5.6H5.9Q3.6 5.5 3.6 7.9V24.1Q3.6 26.5 5.9 26.4H9.2',
    'M22.8 5.6H26.1Q28.4 5.5 28.4 7.9V24.1Q28.4 26.5 26.1 26.4H22.8',
  ],
  /** The two resting cells. */
  cells: [
    { x: 6.8, y: 14.2, w: 3.2, h: 6.4 },
    { x: 13.1, y: 14.2, w: 3.2, h: 6.4 },
  ],
  /** The highlighted cell: the one the window just slid onto. */
  hot: { x: 19.7, y: 10.6, w: 5.2, h: 9.2 },
  radius: 1.3,
} as const

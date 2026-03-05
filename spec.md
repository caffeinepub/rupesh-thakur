# Rupesh Thakur

## Current State
Full personal brand website with Hero, Intro, About, Skills, Vision, and Contact sections. Backend has `getVisitorCount` and `incrementVisitorCount` endpoints. The hero section already increments visitor count on page load. A `useGetVisitorCount` hook exists in `useQueries.ts` but is not used anywhere in the UI.

## Requested Changes (Diff)

### Add
- A new **Visitor Counter** section between the Vision section and the Contact section (or just before Contact/Footer)
- The section should display the total visit count pulled from the backend using `useGetVisitorCount`
- Animated number display with a counting-up effect when the section scrolls into view
- Red glowing style consistent with the rest of the site — dark background, red glow on the counter number, section title styled like other section headers

### Modify
- `App.tsx`: Add `VisitorCounterSection` component and render it between `VisionSection` and `ContactSection`
- Add "visitors" to the navigation links if appropriate (keep nav clean — may skip if it clutters)

### Remove
- Nothing

## Implementation Plan
1. Create `VisitorCounterSection` component in `App.tsx`
2. Use `useGetVisitorCount()` hook to fetch the count
3. Animate the number counting up from 0 to the actual value using a scroll-triggered effect (useScrollReveal pattern already in use)
4. Style: full black background, large red-glowing counter number in Bebas Neue font, subtle ambient glow, section label, supporting copy like "Total Visitors" or "People have visited this site"
5. Insert `<VisitorCounterSection />` between `<VisionSection />` and `<ContactSection />` in the main App render
6. Add `data-ocid="visitors.section"` and `data-ocid="visitors.counter"` markers

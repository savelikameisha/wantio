# Wantio logo

The canonical logo is [`public/icon.svg`](../public/icon.svg), the original
`wantio logo.svg` supplied by the product owner on 11 September 2026 (SAV-12).
It is a blue-to-violet rounded hexagon with a white **w**. The previous pale-blue
plus logo is retired.

## Usage

- Preserve the original 20 × 20 viewBox, proportions, gradient and white mark.
- Scale uniformly; do not crop, stretch, recolor or replace the letter.
- Keep controls such as “add” as action icons, distinct from the brand logo.
- Use an accessible Wantio label when the mark identifies a link; use empty alt
  text when adjacent text already supplies the name.
- The gradient runs from #466BEA to #5156F3. These are logo colors, not an
  instruction to recolor the rest of the product.

## Generated assets

Run `npm run build:extension` from the repository root. It generates the Next.js
SVG, Apple touch icon, multi-size favicon and Chrome icons (16, 32, 48 and 128 px)
from the canonical SVG, then packages the extension. Do not edit generated icons.
Web headers, landing, login, extension connection and help/privacy pages load
`/icon.svg`; the extension uses its generated PNGs.

For marketplace materials, refresh the extension screenshots with
`scripts/test-extension-live.mjs`, then run `node scripts/build-store-assets.mjs`.
The package remains version **2.0.0**. Uploading that package and refreshed listing
assets to Chrome Web Store is a separate publishing step.

## Future surfaces

The internal brand book/component page (SAV-13) and future Mobile App must use
this source and these rules. Platform-specific icon layouts may add appropriate
padding/backgrounds while preserving the mark. Those surfaces are not built as
part of the logo replacement.

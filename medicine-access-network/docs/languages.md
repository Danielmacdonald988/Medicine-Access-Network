# Website languages

The site supports English, Spanish, French, Portuguese, German, Italian, Dutch, Simplified Chinese, Japanese, and Korean. It renders the chosen language on the server and shares that same language with client components.

Resolution order: a valid `tfn_language` cookie, then the request's quality-ranked `Accept-Language`, then English. Regional preferences such as `es-MX` and `pt-BR` map to the supported base language. Chinese variants currently use Simplified Chinese. The language menu lets visitors override the browser or return to its default. The cookie lasts one year and contains only a language code; it is not an account preference shared between devices.

The language menu refreshes the current route without changing its URL or remounting form state. Search terms and filter values remain in the URL. Canonical modality names and submitted form enum values never change with the display language. Known translated practice names expand to the corresponding canonical modalities while the original typed words are also searched against authored content. Rates retain their original USD amounts.

## Translation boundary

Navigation, discovery, profile controls, contact forms, account forms, and facilitator workflow text use first-party catalogs. No page-wide translation script or translation API receives page contents, credentials, inquiries, or account details. Unknown messages fall back to English.

Facilitator biographies, training descriptions, reviews, names, locations, and private messages remain as written. Original profile text is explicitly identified. Safety library pages offer localized summaries with the full English source article clearly marked and retained. Provider emails remain in their existing language. Language preference is not a location signal: US emergency numbers remain explicitly marked US.

These are AI-assisted translations of site copy. Medical/service disclaimers retain their original limits, but a fluent human review is advisable before marketing extensively in a new language. Readers can select English to compare with the source.

## Maintaining translations

- `lib/i18n/config.ts` defines the supported language order and locale negotiation.
- `lib/i18n/messages/` contains English source keys and translation tuples in the order documented by `MessageCatalog`.
- Server components use `getTranslation()`; client components use `useTranslation()`. Translate display labels only, not `value`, `name`, `href`, IDs, or stored data.
- Use complete messages with named placeholders, e.g. `t('Contact {name}', { name })`. Placeholders must appear unchanged in each translation. React escapes the output; never insert translations as HTML.
- After changing translated modality/category labels, run `npx tsx scripts/generate-search-aliases.ts` and the unit tests. The generated small alias map prevents shipping every language's full catalog in the browser search bundle.
- Catalog tests check all nine translated values and placeholder parity. Search tests check translated terms still select the correct stored practices.
- Adding another language requires completing its catalog entries and updating the typed locale/tuple definition, native name, and tests.

URLs and canonical links remain stable. This release does not introduce separate indexed language URLs or `hreflang`. A future content-translation provider should handle approved public content only, use source-versioned caches, provide the original text, and keep all private forms/messages excluded. Do not infer spoken languages or clinical qualifications from a translated profile.

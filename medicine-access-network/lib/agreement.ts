import { CURRENT_AGREEMENT_VERSION } from './validations'

// 2026-11-11.1 is the first agreement version under which a guide's bio is
// published on their approved listing; the database enforces the same rule
// (db/migrations/20261111201500_public_bio_opt_in.sql). A profile that last
// accepted an earlier version keeps a private bio. Changing the current
// version requires matching database, legal-page and archive changes.
export { CURRENT_AGREEMENT_VERSION }
export const PUBLIC_BIO_AGREEMENT_VERSION = '2026-11-11.1'

export function bioIsPublicUnder(agreementVersion: string | null | undefined): boolean {
  return agreementVersion === PUBLIC_BIO_AGREEMENT_VERSION
}

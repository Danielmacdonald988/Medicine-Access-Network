# Password-free facilitator signup

Share `https://thefacilitatornetwork.com/signup?utm_source=instagram&utm_medium=bio` in the Instagram bio and Story link stickers. The existing `/signup` address now collects name, email and an optional Instagram handle. New accounts save these in Supabase Auth metadata at the initial request, before email verification. No public facilitator profile is created until the application is submitted and approved. Existing accounts receive a login link without having their metadata overwritten.

Returning users can request an email link at `/login`; existing password login remains available. The application starts with the saved name.

## Required email configuration before release

In Supabase Authentication → Email Templates, use `passwordless-email-template.html` for **Confirm signup** and **Magic link**, with subject `Your secure link — The Facilitator Network`. Both templates must support the new-account and returning-account cases. Preserve any other templates, including password recovery.

The template uses `.SiteURL` with a fixed `/auth/callback?token_hash=` address, `.TokenHash`, and `type=email`. This remains valid even when an older client omits a return URL or query string. After email sign-in, the callback chooses the appropriate application or dashboard from the authenticated account. The callback verifies the email token directly, so it does not depend on cookies from Instagram’s in-app browser being available in the browser that opens the email. Keep the existing code exchange for password resets and older links.

Allow the production and preview `/auth/callback` URLs including query parameters in Supabase URL Configuration. Confirm SMTP delivery is configured. Deploying code does not install the email template. Both live templates were activated separately on September 15, 2026, after the signup deployment succeeded. The production callback allowlist includes both www and non-www origins. Inbox delivery testing requires an approved test recipient.

## Release acceptance checks

- Submit a new signup. Verify an unconfirmed Auth account exists with the name and normalized Instagram handle, and no public profile is published.
- Open the delivered link in a different browser. Confirm that it signs in and opens the application with the saved name.
- Reusing or using an expired link shows a recovery message and lets the person request another.
- Existing guides reach their dashboard and admins reach administration. Password login and password recovery still work.
- Check rate-limit/network errors, invalid emails and handles, and signup without Instagram.
- Never include email addresses, handles or authentication tokens in analytics or logs.

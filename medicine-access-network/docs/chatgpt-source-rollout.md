# Coarse ChatGPT source classification

## Signal and limits

Only `chatgpt` is stored and transmitted, never the raw referrer, landing query, prompt, conversation ID, or campaign identifier. Exact `utm_source=chatgpt.com` (one occurrence only) is reduced locally to a boolean. It takes precedence over referrer classification for a new session. Existing tab sessions keep their original source and expire normally.

Recognized referrer hosts after existing www normalization: `chatgpt.com`, `chat.openai.com`. No broad `openai.com` or arbitrary subdomains. No pixels or additional services.

OpenAI's indexed Publishers and Developers FAQ (https://help.openai.com/en/articles/12627856, search retrieved November 8, 2026) documents `utm_source=chatgpt.com`. The live URL now redirects to Atlas retirement; this is formerly documented behavior, not a guarantee every present link has a tag. ChatGPT's current domain is linked from that live OpenAI page; `chat.openai.com` is the legacy app domain. OpenAI also lists both domains in its current network guidance: https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps. That infrastructure list is not evidence every listed app subdomain sends referrals, so the classifier intentionally stays narrow. Missing signals remain other/direct. Tags can be copied/spoofed. This does not measure unclicked mentions, crawler fetches, unique people, or prove recommendation/causal attribution.

## Rollout gate

No live changes are part of this implementation. After approval, apply `20261108163015_coarse_chatgpt_referral_source.sql` BEFORE deploying client/API. Verify the expanded constraint is validated, RLS and grants unchanged, and existing rows untouched. Then deploy reviewed app with passing CI. Do not generate production events for QA.

## Rollback

Revert app if needed but retain the expanded DB constraint: narrowing it after ChatGPT rows exist would fail or require destructive data changes. No backfill/reclassification. No auth, retention, rate-limit or permission changes.

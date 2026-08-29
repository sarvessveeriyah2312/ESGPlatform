-- Per-partner "require MFA for teammates" toggle (partner console Security settings) — separate
-- from PlatformSettings.require2fa, which is a platform-wide toggle applying to every role and
-- must stay platform-admin-only. A partner-admin can require it for just their own team.

ALTER TABLE partner ADD COLUMN mfa_required_for_team BOOLEAN NOT NULL DEFAULT false;

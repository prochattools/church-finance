---
name: "✅ New SaaS Project Checklist"
about: "Checklist for setting up a new SaaS project from boilerplate-saas"
title: "New SaaS Setup"
labels:
  - "setup"
assignees: []
---

## New SaaS Project Setup Checklist
- [ ] Created repo from boilerplate-saas template
- [ ] Cloned repo locally
- [ ] Provisioned new Supabase project
- [ ] Added DATABASE_URL, NEXTAUTH_SECRET, RESEND_API_KEY, etc. to .env
- [ ] Configured Cloudflare tunnel and DNS
- [ ] Set up Dokploy app with branch = main and PR previews enabled
- [ ] Deployed to Dokploy and ran `npx prisma migrate deploy && npm run start`
- [ ] Verified `/api/health` endpoint works
- [ ] Opened first PR to test preview deployment
- [ ] Updated `package.json` and `README.md` project name

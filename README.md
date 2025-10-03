![CI Pipeline](https://github.com/prochattools/boilerplate-main/actions/workflows/docker.yml/badge.svg)

# Stevie's Studio — Typescript

Hey Indie Hacker 👋 it's Steve from [Stevie's Studio](https://docs.microsaasfast.me/). Let's build your SaaS fast and NOW!

<sub>**Watch/Star the repo to be notified when updates are pushed**</sub>

## Get Started

1. Follow the [Get Started Tutorial](https://docs.microsaasfast.me/) to clone the repo and run your local server 💻

2. Follow the [Run your SaaS In 5 Minutes Tutorial](https://docs.microsaasfast.me/microsaas-in-5-minutes/) to learn the boilerplate and launch your micro SaaS today!

# 🚀 How to Start a New SaaS Project from Boilerplate

1. **Create new repo from template**
   - Go to https://github.com/prochattools/boilerplate-saas
   - Click "Use this template" → "Create a new repository"
   - Name your new repo after your SaaS project
2. **Clone your new repo**
   ```bash
   git clone https://github.com/prochattools/YOUR-SaaS.git
   cd YOUR-SaaS
   ```
3. **Set up environment**
   - Provision a new Supabase project
   - Copy the Supabase connection string into `.env` as `DATABASE_URL`
   - Add `NEXTAUTH_SECRET`, `RESEND_API_KEY`, and other secrets
   - Prepare Cloudflare Tunnel and Dokploy app:
     - In Cloudflare, add DNS entry pointing to your Dokploy tunnel
     - In Dokploy, create a new app pointing to this repo’s main branch and enable PR previews
     - Paste your secrets into Dokploy’s Environment Variables panel
4. **First deployment**
   - Push to `main` which triggers automatic deploy via Dokploy GitHub App
   - After deploy finishes, run in Dokploy “Run Command”:
     ```bash
     npx prisma migrate deploy && npm run start
     ```
   - Verify `/api/health` endpoint returns `ok`
5. **Preview deployments (PRs)**
   - Create a branch, push it, and open a PR
   - Dokploy will provision a preview environment automatically
   - Each PR should use its own ephemeral Supabase database (create manually until automated)
6. **Start coding your SaaS**
   - Extend models in `prisma/schema.prisma`, run migrations, and deploy
   - Use built-in Next.js, Prisma, Supabase, auth, email, and CI/CD
7. **Optional housekeeping**
   - Run `npm audit fix` regularly
   - Update project name in `package.json`, `README.md`, and environment variables

## Links

- [📚 Documentation](https://docs.microsaasfast.me/)
- [🧑‍💻 Discord](https://discord.gg/U75p2BQuAH)
- [🧑‍💻 Free clients guide](https://www.notion.so/Product-Hunt-Launch-36a5b9610bf04559b8fcf4a2a7b90ea6?pvs=4)

## Support

Reach out to me on [Twitter](https://twitter.com/iamstv) or made@stevie.studio

## Development Workflow

**Important**: This boilerplate uses a Git + Dokploy workflow for safe deployments. See [docs/git-workflow.md](./docs/git-workflow.md) for complete details.

**Key Rules:**
- Never push directly to `main`
- Always create feature branches
- Test preview deployments before merging
- Merge to `main` only when ready for production

## Deployment Pipeline

- **Main branch deployments** – Handled via the Dokploy GitHub App. Builds run on the Dokploy server using Nixpacks, consuming server resources.
- **Preview deployments (feature branches / PRs)** – Also triggered by the Dokploy GitHub App with builds executed on the Dokploy server.
- **Container images pipeline** – Managed by `.github/workflows/docker.yml` in GitHub Actions, which builds and pushes images to GHCR. These images are not yet used for live deployments but are ready for future image-based previews.

> **Note:** Dokploy deployments currently build on the server, so they consume local resources. The GitHub container image pipeline is kept so we can switch quickly when Dokploy supports image-based previews.

### Future Migration: Switching to Container Images
1. Enable container-image based deployments in Dokploy (feature pending release).
2. Configure the Dokploy production app to pull `ghcr.io/prochattools/boilerplate-main:main-latest`.
3. Set preview deployments to pull tags like `ghcr.io/prochattools/boilerplate-main:feature-branchname-latest`.
4. Remove the Dokploy Nixpacks build configuration once image-only deployments are verified.
5. Confirm GitHub workflow secrets (e.g., `GHCR_PAT`) remain valid and images push successfully.
6. Remove this migration section after the transition is complete.

## Setup for New Projects

With every new Project
1. Copy the boilerplate as a new project
2. Change the name of the project
3. update the /.env
4. create the products in stripe
5. update the /src.config.ts with the priceid's from stripe
6. Follow the [Git + Dokploy workflow](./docs/git-workflow.md) for all development

## Release notes

17 sep: this is the [MASTER] boilerplate. It is a copy of the original optimized to work with [Dokploy] and Supabase [Cloud]. In the docker yaml DOCKER_USERNAME and DOCKER_SECRET have been removed. This boilerplate is NOT optimised to run locally with Docker.
test deploy Thu Sep 25 20:45:36 WEST 2025
test deploy Thu Sep 25 20:47:56 WEST 2025
Testing PR deployment at Fri Sep 26 11:25:25 WEST 2025

# 🚀 SaaS Launch Guide with PR Preview DBs

This boilerplate now provisions **unique Supabase databases for each project and PR**.  

## ✅ Main Deployments
- Run ./scripts/provision-saas.sh <app-name> <domain>
- Creates Supabase project + DB.
- Injects DATABASE_URL, ANON_KEY, SERVICE_ROLE_KEY into .env.
- Runs `npx prisma migrate deploy` locally to prepare DB.
- Creates DNS record via Cloudflare + triggers Dokploy deploy.

## ✅ PR Preview Deployments
- When a PR is opened → script provisions a new Supabase DB + injects secrets into Dokploy preview env.
- Dokploy deploys preview app with that DB.
- When PR is closed → script destroys preview DB + cleans secrets.

Important: This repo is the golden SaaS boilerplate. Don’t build real products directly in this repo — always create a new repo from it.

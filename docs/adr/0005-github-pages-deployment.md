# ADR 0005: GitHub Pages Deployment Strategy

**Status:** Accepted
**Date:** 2026-01-31
**Decision Makers:** POF Orchestrator
**Phase:** 5.5 Rollback Documentation

## Context

The Masking game is a static web application built with Phaser 3, TypeScript, and Vite. It requires hosting for public access with minimal cost and maintenance overhead. The project is open source and hosted on GitHub at `Pelinakit/masking`.

## Decision

Deploy the game to GitHub Pages using automated GitHub Actions workflow.

### Configuration

1. **Base path**: Set `base: '/masking/'` in `vite.config.ts` to match GitHub Pages URL structure
2. **GitHub Actions workflow**: `.github/workflows/deploy-gh-pages.yml`
   - Triggers on push to main branch
   - Uses Bun for build process
   - Deploys to `gh-pages` branch
3. **Repository settings**: GitHub Pages enabled with source set to "GitHub Actions"

### Build Process

```bash
bun install --frozen-lockfile
bun run build
# Output: dist/ directory (~1.6MB uncompressed, 367KB gzipped)
```

### Deployment URL

`https://pelinakit.github.io/masking/`

## Rationale

### Why GitHub Pages Over Netlify/Vercel

**GitHub Pages selected because:**
- Zero cost for public repositories
- No external service account required
- Fully automated CI/CD with GitHub Actions
- Direct integration with existing Git workflow
- Sufficient for game's static hosting needs
- No build minute limitations

**Netlify/Vercel considered but not needed:**
- Would require additional service accounts
- Offer features (serverless functions, edge computing) not needed for static game
- Free tier limits adequate but unnecessary complexity

### Why Automated Workflow Over Manual Deployment

- Reduces human error in deployment process
- Ensures consistent build environment
- Automatic deployment on merge to main
- Build verification before deployment
- Deployment history tracked via Git commits

## Consequences

### Positive
- Zero ongoing hosting cost
- Automatic deployment on push to main
- Public URL immediately available
- No additional service dependencies
- Build errors caught in CI before deployment
- Full deployment history in GitHub Actions logs

### Negative
- URL includes `/masking/` path (not root domain)
- Requires Vite base path configuration
- Deployment tied to GitHub availability
- Repository must remain public for free hosting

### Neutral
- Deploy time ~2-3 minutes per push
- Cached dependencies speed up subsequent builds
- Can switch to Netlify/Vercel later by deploying same `dist/` folder

## Rollback Procedures

### Option 1: Revert Git Commit (Recommended)

```bash
# Identify commit to revert to
git log --oneline

# Revert to previous working commit
git revert <commit-hash>
git push origin main

# GitHub Actions will automatically redeploy the reverted version
```

### Option 2: Disable Deployment

```bash
# Temporarily disable GitHub Pages
# 1. Go to repository Settings > Pages
# 2. Change source to "None"
# 3. Site will be taken offline immediately
```

### Option 3: Manual Rollback via GitHub Actions

```bash
# Re-run a previous successful workflow
# 1. Go to Actions tab
# 2. Select successful deployment run
# 3. Click "Re-run all jobs"
```

### Option 4: Switch to Different Hosting

```bash
# If GitHub Pages fails, deploy to Netlify/Vercel
bun run build
# Upload dist/ folder to Netlify Drop or Vercel CLI

# Configuration files already exist:
# - netlify.toml
# - vercel.json
```

### Emergency Rollback Time

- **Option 1 (Git revert)**: 2-3 minutes (revert + CI/CD)
- **Option 2 (Disable Pages)**: 30 seconds (manual)
- **Option 3 (Re-run workflow)**: 2-3 minutes (automated)
- **Option 4 (Switch host)**: 5 minutes (manual upload)

## Verification

### Deployment Success Criteria

- Game loads at `https://pelinakit.github.io/masking/`
- All assets load correctly (no 404 errors)
- Game initializes and shows main menu
- Audio plays (if enabled by user)
- Game state persists across page reloads (localStorage)
- Responsive layout works on mobile and desktop

### Monitoring

- GitHub Actions logs show successful build and deployment
- Browser console shows no critical errors
- Network tab shows all assets loading from correct base path

### Deployment Verification (Completed)

Deployment executed successfully on 2026-01-31:
- Build completed without errors
- GitHub Actions workflow passed
- Game accessible at production URL
- All verification criteria met

## Notes

- The `/masking/` base path affects asset loading and routing
- Local development uses root path (`/`) - preview production build with `bun run preview` after building with production config
- Source maps excluded from production build (configured in `vite.config.ts`)
- Phaser game assets cached by browser (efficient for players, but may require hard refresh after updates)

## Related Decisions

- ADR 0004: Project scaffolding structure (Vite as bundler)
- Deployment plan document: `.claude/context/deployment-plan.md`

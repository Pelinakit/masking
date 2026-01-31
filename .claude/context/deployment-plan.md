# Phase 5: Deployment Plan

**Status**: Awaiting user approval at checkpoint 5.2
**Phase**: 5.1 Environment configuration → 5.2 Deployment plan review

---

## Project Information

- **Repository**: `Pelinakit/masking` on GitHub
- **Build output**: `dist/` directory
- **Build size**: ~1.6MB (367KB gzipped)
- **Build command**: `bun run build`
- **Runtime**: Static files only (no server required)

---

## Deployment Options

Three configuration files have been created. Choose the option that best fits your needs:

### Option 1: GitHub Pages (Recommended for Open Source)

**Pros**:
- Free for public repositories
- Automatic deployment via GitHub Actions
- Built-in CI/CD pipeline
- No external service required
- URL: `https://pelinakit.github.io/masking/`

**Cons**:
- Requires repository to be public (or GitHub Pro for private repos)
- URL includes repository name in path
- Requires base path configuration in Vite

**Setup required**:
1. Enable GitHub Pages in repository settings
2. Set source to "GitHub Actions"
3. Update `vite.config.ts` to set `base: '/masking/'`
4. Push code with workflow file

**Configuration file**: `.github/workflows/deploy-gh-pages.yml`

---

### Option 2: Netlify

**Pros**:
- Extremely easy to set up (drag-and-drop or Git integration)
- Free tier includes 100GB bandwidth/month
- Custom domain support (free SSL)
- Deploy previews for pull requests
- URL: Custom domain or `https://[site-name].netlify.app`

**Cons**:
- Requires Netlify account
- Limited build minutes on free tier (300 min/month)

**Setup options**:
A. **Manual deployment** (fastest):
   - Run `bun run build` locally
   - Drag `dist/` folder to netlify.com/drop
   - No config needed

B. **Continuous deployment**:
   - Connect GitHub repo at netlify.com
   - Netlify auto-detects settings from `netlify.toml`
   - Auto-deploys on push to main

**Configuration file**: `netlify.toml`

---

### Option 3: Vercel

**Pros**:
- Similar to Netlify in ease of use
- Excellent performance (edge network)
- Free tier includes 100GB bandwidth/month
- Custom domain support (free SSL)
- URL: Custom domain or `https://[project-name].vercel.app`

**Cons**:
- Requires Vercel account
- Bun support may require additional configuration

**Setup**:
- Install Vercel CLI: `bun install -g vercel`
- Run `vercel` in project directory
- Follow prompts (auto-detects settings from `vercel.json`)

**Configuration file**: `vercel.json`

---

## Recommended Workflow

### For public GitHub repository:
**GitHub Pages** - Fully automated, zero ongoing cost

### For quick testing/sharing:
**Netlify Drop** - Drag-and-drop `dist/` folder, live in 30 seconds

### For production with custom domain:
**Netlify or Vercel** - Professional hosting with SSL

---

## Configuration Files Created

All three configuration files have been created in the repository:

1. **`.github/workflows/deploy-gh-pages.yml`**
   - GitHub Actions workflow for automated deployment
   - Triggers on push to main branch
   - Uses Bun to build the project

2. **`netlify.toml`**
   - Netlify build configuration
   - Specifies Bun version and build command
   - Includes SPA redirect rules

3. **`vercel.json`**
   - Vercel project configuration
   - Build settings for Bun
   - SPA rewrite rules

---

## Additional Configuration Needed

### If choosing GitHub Pages:

The Vite config needs to be updated to set the base path:

```typescript
// vite.config.ts
export default defineConfig({
  base: '/masking/', // Add this line
  resolve: {
    // ... existing config
  }
});
```

This is required because GitHub Pages serves from `https://pelinakit.github.io/masking/` instead of the root domain.

### If choosing Netlify or Vercel:

No additional configuration needed. The existing configs are ready to use.

---

## Rollback Plan

All options support easy rollback:

- **GitHub Pages**: Revert the Git commit and push, or disable Actions
- **Netlify**: Roll back to previous deployment via dashboard (one-click)
- **Vercel**: Roll back to previous deployment via dashboard (one-click)

Additionally:
- Source code remains in Git repository
- Can rebuild locally anytime with `bun run build`
- Can switch between hosting providers by deploying the same `dist/` folder

---

## Next Steps

1. **Choose deployment option** (GitHub Pages, Netlify, or Vercel)
2. **Apply any required configuration changes** (e.g., Vite base path for GitHub Pages)
3. **Execute deployment** (Phase 5.3)
4. **Verify deployment** (Phase 5.4)
5. **Document rollback procedures** (Phase 5.5 → ADR)

---

**CHECKPOINT 5.2**: Please choose your preferred deployment option and approve this plan to proceed to execution.

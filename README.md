# HaloBloc Back Office — Hostinger Deploy Notes

**Stack:** React + Vite + TypeScript (HashRouter)  
**Persistence:** LocalStorage (no backend)  
**Hosting target:** Hostinger (static site)

## Correcting Your GitHub Repository

If you've noticed that only this `README.md` file is appearing in your GitHub repository, it's likely that the other project files were not added to Git before you committed and pushed. This is a common issue when first setting up a repository.

To fix this, please run the following commands in your project's terminal:

1.  **Stage all files for commit:** This command tells Git to track all new and modified files in your project directory.
    ```bash
    git add .
    ```

2.  **Commit the staged files:** This creates a snapshot of your project.
    ```bash
    git commit -m "Add all project files"
    ```

3.  **Push the commit to GitHub:** This will upload all the newly committed files to your remote repository.
    ```bash
    git push
    ```

After running these commands, all your project files should appear on GitHub. A `.gitignore` file has also been added to this project to ensure that unnecessary files (like `node_modules`) are not tracked.

---

## Hostinger Git Settings
- **Build command:** `npm ci && npm run build`
- **Publish directory:** `dist`
- **Deployment path:** `public_html`
- **Node version:** `>=20` (use `.nvmrc` or `"engines"` in `package.json`)
- **Routing:** HashRouter (no `.htaccess` SPA rewrite required)
- **Vite base:** `/` (use `/<subfolder>/` only if deploying under a subdirectory)
- **Do not commit:** `dist/` when using server builds

## Deploy (Git on Hostinger)
1. hPanel → **Advanced → Git → Connect repository** (use SSH URL; add Deploy Key as read-only).
2. Set the values above and **Deploy**. (Optional: enable Auto deployment on push.)

## Manual Upload (optional)
Build locally (`npm ci && npm run build`) and upload the **contents** of `dist/` to `public_html/`.
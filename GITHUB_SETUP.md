# GitHub: new project setup (Click to Clean)

This file is **only** for publishing this repo to GitHub and opening the app on your phone. Your code lives in this folder as a **standalone project** (not tied to other Cursor workspaces).

## 1. Create a new repository on GitHub

1. Open [github.com/new](https://github.com/new).
2. **Repository name:** e.g. `click-to-clean` (you can use any name).
3. Choose **Public** (needed for free GitHub Pages, unless you use a paid/private Pages setup).
4. **Do not** add a README, `.gitignore`, or license (this project already has them).
5. Click **Create repository**.

## 2. Push this folder from your Mac (first time)

In Terminal, run (replace `YOUR_USER` and `click-to-clean` if your repo name differs):

```bash
cd "/Users/anand1.bhatt/Documents/Clean city/click-to-clean"

git init
git branch -M main
git add .
git commit -m "Initial commit: Click to Clean citizen app"

git remote add origin https://github.com/YOUR_USER/click-to-clean.git
git push -u origin main
```

If you use SSH:

```bash
git remote add origin git@github.com:YOUR_USER/click-to-clean.git
git push -u origin main
```

Use a **Personal Access Token** as the password if GitHub asks (HTTPS), or use the GitHub CLI: `gh auth login`.

## 3. Turn on GitHub Pages (for phone / browser URL)

After the first successful push:

1. Repo → **Settings** → **Pages**.
2. Under **Build and deployment** → **Source**, pick **GitHub Actions** (not “Deploy from a branch” for this workflow).
3. Save if needed.

The workflow in `.github/workflows/deploy-pages.yml` runs on every push to `main`, builds with `VITE_BASE=/repository-name/`, and deploys the `dist` folder.

4. Repo → **Actions** → open the latest **Deploy to GitHub Pages** run → wait until it is green.

Your site URL will look like:

```text
https://YOUR_USER.github.io/click-to-clean/
```

Open that link on your phone (Safari/Chrome). The app is a client-only PWA-style SPA; location/camera need **HTTPS**, which GitHub Pages provides.

## 4. If you rename the repository

The build uses the repo name as the URL path (`VITE_BASE`). If you rename the repo on GitHub, push again to `main` so Actions rebuilds with the new base path.

## 5. Local dev (unchanged)

```bash
cd "/Users/anand1.bhatt/Documents/Clean city/click-to-clean"
npm install
npm run dev
```

Local dev uses `/` as base (no `VITE_BASE`).

## 6. Optional: test a production build locally

```bash
VITE_BASE=/click-to-clean/ npm run build
npx vite preview
```

(Replace `click-to-clean` with your actual repo name.)

---

**Summary:** Create empty repo → `git init` / commit / `git remote` / `git push` → enable **Pages → GitHub Actions** → wait for Actions → use `https://<user>.github.io/<repo>/` on your phone.

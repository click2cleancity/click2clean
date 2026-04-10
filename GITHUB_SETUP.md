# Step-by-step: New GitHub repo for Click to Clean

Use this checklist the first time you put **this project folder** on GitHub.  
Project path: `Documents/Clean city/click-to-clean`

---

## Before you start

- A [GitHub](https://github.com) account (sign up if you don’t have one).
- [Git](https://git-scm.com) installed on your Mac (Terminal: `git --version` should print a version).

---

## Step 1 — Create an empty repository on GitHub

1. Log in to GitHub.
2. Click the **+** (top right) → **New repository**  
   Or open: **https://github.com/new**
3. **Repository name:** choose one, e.g. `click-to-clean` (remember it; it becomes part of your site URL).
4. **Description:** optional.
5. Select **Public** (simplest for free GitHub Pages).
6. **Important:** leave these **unchecked**:
   - Add a README  
   - Add .gitignore  
   - Choose a license  
   (This repo already has README, `.gitignore`, and code.)
7. Click **Create repository**.

GitHub will show a page with setup hints. **Keep that tab open** — you need the repo URL in Step 3.

---

## Step 2 — Open Terminal and go to the project

```bash
cd "/Users/anand1.bhatt/Documents/Clean city/click-to-clean"
```

---

## Step 3 — Connect your folder to GitHub and push

You need your **GitHub username** and the **exact repo name** you chose.

### 3a — If this folder is **not** a git repo yet (first time ever)

Run:

```bash
cd "/Users/anand1.bhatt/Documents/Clean city/click-to-clean"

git init
git branch -M main
git add .
git commit -m "Initial commit: Click to Clean"
```

### 3b — If you **already** ran `git init` and committed (skip 3a)

Only add the remote and push (Step 3c).

### 3c — Add `origin` and push (everyone does this)

Replace `YOUR_GITHUB_USERNAME` and `YOUR_REPO_NAME`:

**HTTPS (simplest):**

```bash
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

**SSH** (if you use SSH keys with GitHub):

```bash
git remote add origin git@github.com:YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

**If `git remote add` fails** with “remote origin already exists”:

```bash
git remote remove origin
```

Then run the `git remote add origin ...` line again.

### 3d — Login when GitHub asks (HTTPS)

- Username: your GitHub username  
- Password: **not** your GitHub password — use a **[Personal Access Token](https://github.com/settings/tokens)** (classic: enable `repo` scope).  
  Create token: GitHub → **Settings** → **Developer settings** → **Personal access tokens**.

---

## Step 4 — Turn on GitHub Pages (site on your phone)

1. Open your repo on GitHub.
2. Click **Settings** (repo menu).
3. Left sidebar → **Pages**.
4. Under **Build and deployment** → **Source**, choose **GitHub Actions** (not “Deploy from a branch”).
5. If GitHub asks to approve workflows the first time: **Actions** tab → approve **Workflow permissions** if prompted.

---

## Step 5 — Wait for the first deployment

1. Click the **Actions** tab in your repo.
2. Open the workflow **Deploy to GitHub Pages**.
3. Wait until the latest run has a **green** checkmark (can take 1–3 minutes).

If it fails, open the failed job and read the error (often Node version or permissions — fix and push again).

---

## Step 6 — Open your live app

Your site URL (replace with your username and repo name):

```text
https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO_NAME/
```

Example: user `alex`, repo `click-to-clean` →  
`https://alex.github.io/click-to-clean/`

Open that URL on your **phone browser** (Safari or Chrome). Location and camera need **HTTPS** — GitHub Pages provides that.

---

## Step 7 — Future changes

After you edit code locally:

```bash
cd "/Users/anand1.bhatt/Documents/Clean city/click-to-clean"
git add .
git commit -m "Describe your change"
git push
```

Actions will rebuild and update the live site.

---

## Troubleshooting (short)

| Problem | What to try |
|--------|-------------|
| `remote origin already exists` | `git remote remove origin` then add again |
| Authentication failed (HTTPS) | Use a **Personal Access Token**, not account password |
| Permission denied (SSH) | Add SSH key: GitHub → Settings → SSH keys, or use HTTPS instead |
| Page is 404 | Wait 2–5 min after green Action; confirm Pages **Source** is **GitHub Actions** |
| Blank / broken styles on Pages | Repo was renamed — push again so workflow rebuilds with new `VITE_BASE` |

---

## Local development (not GitHub)

```bash
cd "/Users/anand1.bhatt/Documents/Clean city/click-to-clean"
npm install
npm run dev
```

---

**Quick sequence:** GitHub **new empty repo** → Terminal **cd** → **git init / commit** (if needed) → **remote + push** → **Settings → Pages → GitHub Actions** → **Actions** wait for green → open **`https://USER.github.io/REPO/`**.

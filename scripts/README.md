Upload to GitHub helper

This folder contains a PowerShell helper script `upload_to_github.ps1` that helps you create a GitHub repository and push the current local repository to it.

Usage

1. Open PowerShell and change directory to the repository root:

```powershell
cd C:\Users\User\Documents\GitHub\PaperGenie
```

2. Run the script using one of the options below:

- Use GitHub CLI (recommended):

```powershell
# will create repo under your authenticated gh account and push
scripts\upload_to_github.ps1 -RepoName paperGen -Public
```

- If you already created the repo on GitHub via the website, provide the remote URL:

```powershell
scripts\upload_to_github.ps1 -RemoteUrl "https://github.com/yourusername/paperGen.git"
```

Requirements

- Git installed and available in PATH
- (Optional but recommended) GitHub CLI `gh` installed and authenticated (`gh auth login`)

Notes

- The script will commit any uncommitted changes with message "chore: initial commit for paperGen" if there are changes.
- Default branch pushed is `master`. Modify the script if you want to use `main`.

Security

- The script does not store your credentials. If using `gh`, follow `gh auth login` to authenticate securely.

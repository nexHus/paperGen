<#
PowerShell helper to create a GitHub repository and push the current local repo.
Usage examples (PowerShell):

# 1) Use GitHub CLI (recommended) to create repo under your authenticated account and push
PS> .\upload_to_github.ps1 -RepoName paperGen -Public

# 2) If you already created the repo on GitHub via the website, supply the remote URL
PS> .\upload_to_github.ps1 -RemoteUrl 'https://github.com/yourusername/paperGen.git'

# Notes:
# - This script assumes you're running it from the repository root (PaperGenie).
# - Git and optionally GitHub CLI (gh) must be installed. Authenticate gh with `gh auth login` beforehand.
# - The default branch pushed is 'master'. Change as needed.
#>

param(
    [string]$RepoName = "paperGen",
    [switch]$Public,
    [switch]$Private,
    [string]$RemoteUrl
)

function Exec([string]$cmd) {
    Write-Host "> $cmd"
    $proc = Start-Process -FilePath pwsh -ArgumentList "-NoProfile","-Command","$cmd" -NoNewWindow -Wait -PassThru -WindowStyle Hidden
n    return $proc.ExitCode
}

# Ensure we're in a git repo
if (-not (Test-Path ".git")) {
    Write-Host "This directory does not look like a git repository. Initializing..."
    git init
}

Write-Host "Staging all changes and committing (if necessary)..."
# Add and commit
git add -A
$hasChanges = (git status --porcelain) -ne ""
if ($hasChanges) {
    git commit -m "chore: initial commit for paperGen"
} else {
    Write-Host "No changes to commit."
}

# If RemoteUrl provided, just add remote and push
if ($RemoteUrl) {
    Write-Host "Using provided remote URL: $RemoteUrl"
    try {
        git remote add origin $RemoteUrl
    } catch {
        Write-Host "Remote 'origin' may already exist. Updating URL..."
        git remote set-url origin $RemoteUrl
    }

    Write-Host "Pushing to origin/master..."
    git push -u origin master
    exit $LASTEXITCODE
}

# Prefer GitHub CLI if available
$ghAvailable = $false
try {
    gh --version > $null 2>&1
    if ($LASTEXITCODE -eq 0) { $ghAvailable = $true }
} catch {
    $ghAvailable = $false
}

if ($ghAvailable) {
    Write-Host "GitHub CLI detected. Creating repository under your authenticated account: $RepoName"
    $vis = "--public"
    if ($Private) { $vis = "--private" }
    if ($Public) { $vis = "--public" }

    # Create repo and push current directory
    gh repo create $RepoName $vis --source=. --remote=origin --push --confirm
    if ($LASTEXITCODE -ne 0) {
        Write-Host "gh command failed. Please run the command printed above manually or create the repo on github.com and rerun with -RemoteUrl."
    }
} else {
    Write-Host "GitHub CLI (gh) not found. Please create a new repository named '$RepoName' on GitHub (https://github.com/new) and copy the HTTPS remote URL."
    $userUrl = Read-Host "Enter remote URL (e.g. https://github.com/yourusername/$RepoName.git)"
    if (-not $userUrl) { Write-Error "No URL provided. Exiting."; exit 1 }

    try {
        git remote add origin $userUrl
    } catch {
        Write-Host "Remote 'origin' may already exist. Updating URL..."
        git remote set-url origin $userUrl
    }

    Write-Host "Pushing to origin/master..."
    git push -u origin master
}

Write-Host "Done. Please verify the repository on GitHub."
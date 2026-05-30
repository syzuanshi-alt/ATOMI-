param(
    [Parameter(Mandatory = $true)]
    [string]$RepositoryUrl
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

if (-not (Test-Path ".git")) {
    throw "This folder is not a Git repository: $repoRoot"
}

$existing = git remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0 -and $existing) {
    git remote set-url origin $RepositoryUrl
}
else {
    git remote add origin $RepositoryUrl
}

git branch -M main
git push -u origin main

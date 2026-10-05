param([ValidatePattern('^[a-z0-9][a-z0-9-]*$')][string]$Theme = 'sunset')
$ErrorActionPreference = 'Stop'
$taskProjectRoot = Split-Path -Parent $PSScriptRoot
$taskAssetRoot = Join-Path $taskProjectRoot 'public\assets\doita'
$taskThemeRoot = Join-Path $taskProjectRoot "public\themes\$Theme"
$taskMagick = (Get-Command magick -ErrorAction Stop).Source
$taskJobs = @(
 @{Source='backgrounds/hero-desktop.png';Target='hero-desktop.webp';Size='1280x720>';Quality='78'},
 @{Source='backgrounds/hero-mobile.png';Target='hero-mobile.webp';Size='640x960>';Quality='78'},
 @{Source='avatars/avatar-a.png';Target='avatar-a.webp';Size='192x192>';Quality='82'},
 @{Source='avatars/avatar-b.png';Target='avatar-b.webp';Size='192x192>';Quality='82'},
 @{Source='stickers/love-envelope.png';Target='envelope.webp';Size='480x480>';Quality='82'},
 @{Source='stickers/couple-mascots.png';Target='mascots.webp';Size='480x480>';Quality='82'},
 @{Source='stickers/soft-heart.png';Target='heart.webp';Size='256x256>';Quality='82'},
 @{Source='stickers/flowers-v2.png';Target='flowers.webp';Size='480x480>';Quality='82'},
 @{Source='empty/notes-empty.png';Target='empty-notes.webp';Size='320x320>';Quality='82'},
 @{Source='empty/memories-empty.png';Target='empty-memories.webp';Size='320x320>';Quality='82'},
 @{Source='empty/wishes-empty.png';Target='empty-prayer.webp';Size='320x320>';Quality='82'},
 @{Source='empty/notifications-empty.png';Target='empty-notifications.webp';Size='320x320>';Quality='82'}
)
New-Item -ItemType Directory -Path $taskThemeRoot -Force | Out-Null
foreach ($taskJob in $taskJobs) {
 $taskInput = Join-Path $taskAssetRoot $taskJob.Source
 $taskOutput = Join-Path $taskThemeRoot $taskJob.Target
 & $taskMagick $taskInput -resize $taskJob.Size -strip -quality $taskJob.Quality $taskOutput
 if ($LASTEXITCODE -ne 0) { throw "Image conversion failed: $($taskJob.Source)" }
}
Get-ChildItem -LiteralPath $taskThemeRoot | Select-Object Name,Length

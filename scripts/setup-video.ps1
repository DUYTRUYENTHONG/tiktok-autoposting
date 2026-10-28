$ErrorActionPreference = 'Stop'
$videoRoot = Join-Path (Split-Path $PSScriptRoot -Parent) 'state\video-toolchain'
New-Item -ItemType Directory -Path $videoRoot -Force | Out-Null
$videoArchive = Join-Path $videoRoot 'compositor.tgz'
$videoIntegrity = 'sha512-u6Y100rmEiQpGj+vnyXihk2/0rYmPJuB4RuE/RaDh0S5hLrOwEHNSaDyeXaakDs/a+VIRnTLmIqy+xR5A2Cs7g=='
$videoUrl = 'https://registry.npmjs.org/@remotion/compositor-win32-x64-msvc/-/compositor-win32-x64-msvc-4.0.506.tgz'
if (-not (Test-Path -LiteralPath $videoArchive)) { Invoke-WebRequest -Uri $videoUrl -OutFile $videoArchive -TimeoutSec 180 }
$videoActual = 'sha512-' + [Convert]::ToBase64String([Security.Cryptography.SHA512]::HashData([IO.File]::ReadAllBytes($videoArchive)))
if ($videoActual -ne $videoIntegrity) { throw 'Video toolchain integrity mismatch' }
$videoEntries = @(tar -tzf $videoArchive)
if ($LASTEXITCODE -ne 0 -or ($videoEntries | Where-Object { $_ -notmatch '^package/' -or $_ -match '(^|/)\.\.(/|$)' })) { throw 'Unexpected archive paths' }
tar -xzf $videoArchive -C $videoRoot
if ($LASTEXITCODE -ne 0) { throw 'Archive extraction failed' }
Write-Output (Join-Path $videoRoot 'package\ffmpeg.exe')

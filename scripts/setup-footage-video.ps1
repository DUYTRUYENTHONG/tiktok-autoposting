$ErrorActionPreference = 'Stop'
$editToolRoot = Join-Path (Split-Path $PSScriptRoot -Parent) 'state\footage-toolchain'
New-Item -ItemType Directory -Path $editToolRoot -Force | Out-Null
$editArchive = Join-Path $editToolRoot 'ffmpeg-9.0.2-essentials_build.zip'
$editSource = 'https://github.com/GyanD/codexffmpeg/releases/download/9.0.2/ffmpeg-9.0.2-essentials_build.zip'
$editHash = '60f467265b1e312373dbcd92200c2618a74850f98d3d078e94296bb3fa2047ba'
if (-not (Test-Path -LiteralPath $editArchive)) { Invoke-WebRequest -Uri $editSource -OutFile $editArchive -TimeoutSec 180 }
if ((Get-FileHash -LiteralPath $editArchive -Algorithm SHA256).Hash.ToLowerInvariant() -ne $editHash) { throw 'Editing toolchain checksum mismatch' }
Add-Type -AssemblyName System.IO.Compression.FileSystem
$editZip = [IO.Compression.ZipFile]::OpenRead($editArchive)
try {
  foreach ($editEntry in $editZip.Entries) {
    if ($editEntry.FullName -notmatch '^ffmpeg-9\.0\.2-essentials_build/' -or $editEntry.FullName -match '(^|/)\.\.(/|$)' -or $editEntry.FullName.Contains('\')) { throw 'Unexpected archive path' }
  }
} finally { $editZip.Dispose() }
Expand-Archive -LiteralPath $editArchive -DestinationPath $editToolRoot -Force
$editBin = Join-Path $editToolRoot 'ffmpeg-9.0.2-essentials_build\bin'
$editReceipt = @{version='9.0.2';source=$editSource;archiveSha256=$editHash;ffmpeg=(Join-Path $editBin 'ffmpeg.exe');ffprobe=(Join-Path $editBin 'ffprobe.exe')}
$editReceipt.ffmpegSha256=(Get-FileHash -LiteralPath $editReceipt.ffmpeg -Algorithm SHA256).Hash.ToLowerInvariant()
$editReceipt | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $editToolRoot 'runtime.json') -Encoding utf8
Write-Output $editReceipt.ffmpeg

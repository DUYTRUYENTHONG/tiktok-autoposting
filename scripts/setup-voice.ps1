$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$synth = [System.Speech.Synthesis.SpeechSynthesizer]::new()
try {
  $voice = $synth.GetInstalledVoices() | Where-Object { $_.Enabled -and $_.VoiceInfo.Culture.Name -eq 'vi-VN' } | Select-Object -First 1
  if (-not $voice) { throw 'No installed Vietnamese Windows voice. Use the optional Piper setup instead.' }
  $voiceBase = if ($env:TIKTOK_VOICE_HOME) { $env:TIKTOK_VOICE_HOME } else { Join-Path $env:USERPROFILE '.codex\data\tiktok-autoposting\voice' }
  if (-not [System.IO.Path]::IsPathRooted($voiceBase)) { throw 'TIKTOK_VOICE_HOME must be absolute' }
  New-Item -ItemType Directory -Path $voiceBase -Force | Out-Null
  $config = @{provider='windows-sapi'; language='vi-VN'; voice=$voice.VoiceInfo.Name; powershell=(Get-Process -Id $PID).Path; version='System.Speech'; attribution='Synthetic Vietnamese stock narration using the installed Microsoft Windows voice.'}
  $config | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $voiceBase 'runtime.json') -Encoding utf8
  $config | Select-Object provider,language,voice | ConvertTo-Json
} finally { $synth.Dispose() }

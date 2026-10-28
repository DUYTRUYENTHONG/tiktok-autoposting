param([string]$InputFile,[string]$OutputFile,[string]$VoiceName,[switch]$ListVoices)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$synth = [System.Speech.Synthesis.SpeechSynthesizer]::new()
try {
  $voices = @($synth.GetInstalledVoices() | Where-Object { $_.Enabled -and $_.VoiceInfo.Culture.Name -eq 'vi-VN' } | ForEach-Object { $_.VoiceInfo.Name })
  if ($ListVoices) { ConvertTo-Json -InputObject $voices -Compress; exit }
  if ($VoiceName -notin $voices) { throw 'The configured Vietnamese stock voice is unavailable' }
  if (-not [System.IO.Path]::IsPathRooted($InputFile) -or -not [System.IO.Path]::IsPathRooted($OutputFile)) { throw 'Absolute paths required' }
  $text = [System.IO.File]::ReadAllText($InputFile,[System.Text.Encoding]::UTF8)
  if ($text.Length -lt 10 -or $text.Length -gt 1500) { throw 'Expected a short narration script' }
  $synth.SelectVoice($VoiceName)
  $synth.Rate = -2
  $synth.Volume = 100
  $synth.SetOutputToWaveFile($OutputFile)
  $synth.Speak($text)
} finally { $synth.Dispose() }

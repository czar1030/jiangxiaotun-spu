$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
try {
  Add-Type -AssemblyName System.Speech
  $speechInput = [Console]::In.ReadToEnd() | ConvertFrom-Json
  $speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
  $available = @($speaker.GetInstalledVoices() | Where-Object { $_.Enabled } | ForEach-Object { $_.VoiceInfo.Name })
  if ($available -contains $speechInput.voice) { $speaker.SelectVoice($speechInput.voice) }
  else {
    $culture = if ($speechInput.locale -match '^zh') { 'zh-CN' } else { 'en-US' }
    $speaker.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Female, [System.Speech.Synthesis.VoiceAge]::Adult, 0, [System.Globalization.CultureInfo]::GetCultureInfo($culture))
  }
  $speaker.Rate = [Math]::Max(-3, [Math]::Min(3, [int]$speechInput.rate))
  $wave = New-Object System.IO.MemoryStream
  $speaker.SetOutputToWaveStream($wave)
  $speaker.Speak([string]$speechInput.text)
  $speaker.SetOutputToNull()
  $bytes = $wave.ToArray()
  $speaker.Dispose()
  $wave.Dispose()
  $outputStream = [Console]::OpenStandardOutput()
  $outputStream.Write($bytes, 0, $bytes.Length)
  $outputStream.Flush()
} catch {
  [Console]::Error.WriteLine('Local speech synthesis failed.')
  exit 1
}

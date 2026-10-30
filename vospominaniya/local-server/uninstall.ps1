# Удаление локального сервера «Воспоминания». Главы на сайте не трогает: они хранятся в браузере.
$ErrorActionPreference = 'Continue'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}
$Dest = Join-Path $env:LOCALAPPDATA 'VospominaniyaLocal'
$LinkName = 'Воспоминания - локальный сервер.lnk'

Get-CimInstance Win32_Process -Filter "Name='pythonw.exe' OR Name='python.exe'" |
    Where-Object { $_.CommandLine -like '*VospominaniyaLocal*server.py*' } |
    ForEach-Object { Write-Host "Останавливаю сервер (процесс $($_.ProcessId))"; Stop-Process -Id $_.ProcessId -Force }

foreach ($dir in @([Environment]::GetFolderPath('Startup'), [Environment]::GetFolderPath('Desktop'))) {
    $p = Join-Path $dir $LinkName
    if (Test-Path $p) { Remove-Item -Force $p; Write-Host "Удалён ярлык: $p" }
}

$answer = Read-Host "Удалить папку $Dest (окружение Python и настройки)? Модели Whisper и Ollama останутся. [y/N]"
if ($answer -match '^(y|д)') { Remove-Item -Recurse -Force $Dest; Write-Host 'Папка удалена.' } else { Write-Host 'Папка оставлена.' }
Write-Host 'Готово. На странице «Воспоминания» можно выбрать «в облаке, как раньше».'

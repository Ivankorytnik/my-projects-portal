# Установка локального сервера распознавания «Воспоминания».
# Ставит в %LOCALAPPDATA%\VospominaniyaLocal: свою копию Python-окружения, faster-whisper, ярлыки запуска.
# Чужие программы (Танька Ассистент, Ollama) не меняет, только читает список моделей.

# Ошибки внешних программ проверяются явно: в Windows PowerShell 5.1 режим Stop обрывает скрипт на любом выводе в stderr.
$ErrorActionPreference = 'Continue'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}
$env:PYTHONIOENCODING = 'utf-8'
$env:PYTHONUTF8 = '1'

$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Dest = Join-Path $env:LOCALAPPDATA 'VospominaniyaLocal'
$Venv = Join-Path $Dest '.venv'
$Py = Join-Path $Venv 'Scripts\python.exe'
$PyW = Join-Path $Venv 'Scripts\pythonw.exe'
$Server = Join-Path $Dest 'server.py'
$Port = 8790
$LinkName = 'Воспоминания - локальный сервер.lnk'

function Step($text) { Write-Host ''; Write-Host "== $text" -ForegroundColor Cyan }
function Fail($text) { Write-Host ''; Write-Host "ОШИБКА: $text" -ForegroundColor Red; exit 1 }

function Find-Python {
    $tries = @(
        @('py', '-3.12'), @('py', '-3.11'), @('py', '-3.10'), @('py', '-3.13'), @('py', '-3'),
        @('python', $null), @('python3', $null)
    )
    foreach ($t in $tries) {
        $exe = $t[0]; $arg = $t[1]
        if (-not (Get-Command $exe -ErrorAction SilentlyContinue)) { continue }
        try {
            $argsList = @()
            if ($arg) { $argsList += $arg }
            $argsList += @('-c', 'import sys,struct;print(sys.version_info[0]*100+sys.version_info[1], struct.calcsize("P")*8, sys.executable)')
            $out = & $exe @argsList 2>$null
            if (-not $out) { continue }
            $parts = ($out | Select-Object -First 1).Trim().Split(' ', 3)
            $ver = [int]$parts[0]; $bits = [int]$parts[1]
            if ($ver -ge 309 -and $bits -eq 64) { return $parts[2] }
        } catch {}
    }
    return $null
}

function Server-Health {
    try { return Invoke-RestMethod -Uri "http://127.0.0.1:$Port/health" -TimeoutSec 4 } catch { return $null }
}

Write-Host 'Установка локального распознавания для раздела «Воспоминания»' -ForegroundColor Green
Write-Host "Папка: $Dest"

# 1. Остановить прежнюю копию сервера, если она запущена
Step 'Проверяю, не запущен ли сервер'
$listen = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($listen) {
    foreach ($c in $listen) {
        $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$($c.OwningProcess)" -ErrorAction SilentlyContinue
        if ($proc -and $proc.CommandLine -like '*VospominaniyaLocal*server.py*') {
            Write-Host "Останавливаю прежний сервер (процесс $($proc.ProcessId))"
            Stop-Process -Id $proc.ProcessId -Force
            Start-Sleep -Seconds 1
        } else {
            Fail "Порт $Port занят другой программой ($($proc.Name)). Сообщите об этом Claude, порт поменяем."
        }
    }
} else { Write-Host 'Не запущен' }

# 2. Python
Step 'Ищу Python 3.9 или новее (64-бит)'
$Base = Find-Python
if (-not $Base) {
    Write-Host 'Python не найден. Ставлю Python 3.12 через winget (только для текущего пользователя).'
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) { Fail 'Нет winget. Установите Python 3.12 с python.org и запустите установку снова.' }
    winget install -e --id Python.Python.3.12 --scope user --accept-package-agreements --accept-source-agreements
    $env:Path = [Environment]::GetEnvironmentVariable('Path', 'User') + ';' + [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $Base = Find-Python
    if (-not $Base) { Fail 'Python установился, но не найден. Закройте окно и запустите установку снова.' }
}
Write-Host "Python: $Base"

# 3. Файлы сервера и окружение
Step 'Копирую файлы сервера'
try {
    New-Item -ItemType Directory -Force -Path $Dest -ErrorAction Stop | Out-Null
    Copy-Item -Force (Join-Path $Here 'server.py') $Server -ErrorAction Stop
} catch { Fail "Не удалось скопировать файлы: $($_.Exception.Message)" }
foreach ($f in @('uninstall.ps1', 'README.txt')) { if (Test-Path (Join-Path $Here $f)) { Copy-Item -Force (Join-Path $Here $f) (Join-Path $Dest $f) } }

Step 'Готовлю отдельное окружение Python (первый раз несколько минут)'
if (-not (Test-Path $Py)) { & $Base -m venv $Venv; if ($LASTEXITCODE -ne 0) { Fail 'Не удалось создать окружение Python.' } }
& $Py -m pip install --disable-pip-version-check -q --upgrade pip
& $Py -m pip install --disable-pip-version-check -q --upgrade 'faster-whisper>=1.1.0'
if ($LASTEXITCODE -ne 0) { Fail 'Не удалось установить faster-whisper. Проверьте интернет и запустите установку снова.' }
& $Py -c 'import faster_whisper; print("faster-whisper", faster_whisper.__version__)'

# 4. Модель Whisper: если Танька Ассистент уже скачал large-v3-turbo, берём её копию на диске
Step 'Ищу уже скачанную модель Whisper large-v3-turbo'
$model = $null
$roots = @((Join-Path $env:LOCALAPPDATA 'TanikaAssistant'), (Join-Path $env:USERPROFILE '.cache\huggingface\hub'))
foreach ($r in $roots) {
    if (-not (Test-Path $r)) { continue }
    $hit = Get-ChildItem -Path $r -Recurse -Filter 'model.bin' -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -match 'turbo' -and (Test-Path (Join-Path $_.DirectoryName 'tokenizer.json')) } |
        Select-Object -First 1
    if ($hit) { $model = $hit.DirectoryName; break }
}
if ($model) {
    Write-Host "Найдена: $model"
    & $Py $Server --set "whisper_model=$model" | Out-Null
} else {
    Write-Host 'Не найдена. Модель (около 1,6 ГБ) скачается сама при первом распознавании.'
}

# 5. Ollama и модель для литературной обработки
Step 'Проверяю Ollama'
$ollama = Get-Command ollama -ErrorAction SilentlyContinue
if (-not $ollama) {
    $cand = Join-Path $env:LOCALAPPDATA 'Programs\Ollama\ollama.exe'
    if (Test-Path $cand) { $ollama = $cand } else { $ollama = $null }
} else { $ollama = $ollama.Source }
if (-not $ollama) {
    Write-Host 'Ollama не найдена. Распознавание будет работать, а литературная обработка нет, пока не установите Ollama с ollama.com.' -ForegroundColor Yellow
} else {
    $list = ''
    try { $list = (& $ollama list 2>&1 | Out-String) } catch {}
    $pick = $null
    foreach ($m in @('qwen2.5:7b', 'qwen2.5:3b')) { if ($list -match [regex]::Escape($m)) { $pick = $m; break } }
    if (-not $pick) {
        Write-Host 'Подходящей модели нет, скачиваю qwen2.5:3b (около 2 ГБ)'
        & $ollama pull qwen2.5:3b
        $pick = 'qwen2.5:3b'
    }
    Write-Host "Модель для обработки текста: $pick"
    & $Py $Server --set "ollama_model=$pick" | Out-Null
}

# 6. Пароль
Step 'Пароль'
$cfg = (& $Py $Server --show-config) -join "`n" | ConvertFrom-Json
if (-not $cfg.password_set) {
    Write-Host 'Задайте пароль, который будете вводить на странице «Воспоминания». Можно прежний.'
    & $Py $Server --set-password
    if ($LASTEXITCODE -ne 0) { Fail 'Пароль не сохранён.' }
} else { Write-Host 'Пароль уже задан. Сменить: set-password.bat' }

# 7. Ярлыки: автозапуск при входе в Windows и на рабочем столе
Step 'Создаю ярлыки'
$shell = New-Object -ComObject WScript.Shell
$targets = @([Environment]::GetFolderPath('Startup'), [Environment]::GetFolderPath('Desktop'))
foreach ($dir in $targets) {
    $lnk = $shell.CreateShortcut((Join-Path $dir $LinkName))
    $lnk.TargetPath = $PyW
    $lnk.Arguments = "`"$Server`" --preload"
    $lnk.WorkingDirectory = $Dest
    $lnk.Description = 'Локальное распознавание для korytnikhub.pro/vospominaniya'
    $lnk.Save()
    Write-Host "Ярлык: $(Join-Path $dir $LinkName)"
}

# 8. Запуск и проверка
Step 'Запускаю сервер'
Start-Process -FilePath $PyW -ArgumentList "`"$Server`" --preload" -WorkingDirectory $Dest -WindowStyle Hidden
$h = $null
for ($i = 0; $i -lt 20 -and -not $h; $i++) { Start-Sleep -Seconds 1; $h = Server-Health }
if (-not $h) { Fail "Сервер не ответил. Журнал: $(Join-Path $Dest 'server.log')" }
Write-Host "Сервер работает: http://127.0.0.1:$Port/health" -ForegroundColor Green
Write-Host "Whisper: $($h.whisper.model)"
Write-Host "Ollama: $(if ($h.ollama.ok) { 'запущена, модель ' + $h.ollama.model } else { 'не отвечает' })"
Write-Host ''
Write-Host 'Готово. Сервер будет запускаться сам при входе в Windows.' -ForegroundColor Green
Write-Host 'На странице «Воспоминания» выберите «на этом компьютере» и введите пароль.'
Write-Host 'Первое распознавание дольше обычного: загружается модель.'

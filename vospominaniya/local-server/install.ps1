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

function Test-Python($exe, $arg) {
    # Возвращает @(версия, путь) или $null. Строку ответа ищем по шаблону: менеджеры Python могут печатать приветствие.
    try {
        $argsList = @()
        if ($arg) { $argsList += $arg }
        # Без двойных кавычек: Windows PowerShell 5.1 теряет их при передаче аргументов внешней программе.
        $argsList += @('-c', 'import sys,struct;print(''PYINFO'', sys.version_info[0]*100+sys.version_info[1], struct.calcsize(''P'')*8, sys.executable)')
        $out = & $exe @argsList 2>&1 | Out-String
        $m = [regex]::Match($out, 'PYINFO (\d+) (\d+) (.+)')
        if (-not $m.Success -or [int]$m.Groups[2].Value -ne 64) { return $null }
        return @([int]$m.Groups[1].Value, $m.Groups[3].Value.Trim())
    } catch { return $null }
}

function Find-Python {
    # Сначала явные пути установки, потом команды. Предпочтение 3.10-3.13: под них точно есть сборки faster-whisper.
    $cands = @()
    foreach ($v in @('312', '311', '310', '313')) {
        $cands += ,@((Join-Path $env:LOCALAPPDATA "Programs\Python\Python$v\python.exe"), $null)
        $cands += ,@((Join-Path $env:ProgramFiles "Python$v\python.exe"), $null)
        $cands += ,@((Join-Path $env:LOCALAPPDATA "Python\pythoncore-$($v.Substring(0,1)).$($v.Substring(1))-64\python.exe"), $null)
    }
    foreach ($a in @('-3.12', '-3.11', '-3.10', '-3.13', '-3')) { $cands += ,@('py', $a) }
    $cands += ,@('python', $null)
    $cands += ,@('python3', $null)
    foreach ($c in $cands) {
        $exe = $c[0]
        if ($exe -like '*\*') { if (-not (Test-Path $exe)) { continue } }
        elseif (-not (Get-Command $exe -ErrorAction SilentlyContinue)) { continue }
        $r = Test-Python $exe $c[1]
        $label = if ($c[1]) { "$exe $($c[1])" } else { $exe }
        if (-not $r) { Write-Host "  $label : не отвечает как Python" -ForegroundColor DarkGray; continue }
        Write-Host "  $label : Python $([math]::Floor($r[0] / 100)).$($r[0] % 100), $($r[1])" -ForegroundColor DarkGray
        if ($r[0] -ge 310 -and $r[0] -le 313) { return $r[1] }
        if ($r[0] -ge 309 -and -not $script:PyFallback) { $script:PyFallback = $r[1] }
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
$pym = Get-Command pymanager -ErrorAction SilentlyContinue
if (-not $Base -and $pym) {
    Write-Host 'Подходящий Python не найден. Ставлю Python 3.12 через Python Install Manager.'
    & $pym.Source install 3.12
    $Base = Find-Python
}
if (-not $Base) {
    Write-Host 'Python не найден. Ставлю Python 3.12 через winget (только для текущего пользователя).'
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) { Fail 'Нет winget. Установите Python 3.12 с python.org и запустите установку снова.' }
    winget install -e --id Python.Python.3.12 --scope user --accept-package-agreements --accept-source-agreements
    $env:Path = [Environment]::GetEnvironmentVariable('Path', 'User') + ';' + [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $Base = Find-Python
}
if (-not $Base -and $script:PyFallback) {
    Write-Host "Python 3.10-3.13 не найден, пробую $script:PyFallback" -ForegroundColor Yellow
    $Base = $script:PyFallback
}
if (-not $Base) { Fail 'Python не найден. Пришлите Claude снимок этого окна.' }
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
& $Py -c 'import faster_whisper; print(''faster-whisper'', faster_whisper.__version__)'

# 3а. GigaAM v3: основной движок для русской речи. Если не встанет, распознавать будет Whisper.
Step 'Ставлю GigaAM v3 (точное распознавание русской речи, первый раз около 1,5 ГБ)'
$giga = $true
& $Py -m pip install --disable-pip-version-check -q torch torchaudio --index-url https://download.pytorch.org/whl/cpu
if ($LASTEXITCODE -ne 0) { $giga = $false; Write-Host 'Не удалось поставить torch.' -ForegroundColor Yellow }
if ($giga) {
    & $Py -m pip install --disable-pip-version-check -q 'gigaam @ https://github.com/salute-developers/GigaAM/archive/refs/heads/main.zip'
    if ($LASTEXITCODE -ne 0) { $giga = $false; Write-Host 'Не удалось поставить пакет GigaAM.' -ForegroundColor Yellow }
}
if ($giga) {
    Write-Host 'Скачиваю и проверяю модель GigaAM v3 e2e (около 900 МБ)...'
    & $Py $Server --download-models
    if ($LASTEXITCODE -eq 0) { Write-Host 'GigaAM готов.' -ForegroundColor Green } else { $giga = $false; Write-Host 'Модель GigaAM не загрузилась.' -ForegroundColor Yellow }
}
if ($giga) { & $Py $Server --set 'asr_engine=gigaam' | Out-Null }
else { & $Py $Server --set 'asr_engine=whisper' | Out-Null; Write-Host 'Распознавать будет Whisper. Пришлите Claude снимок окна, разберёмся.' -ForegroundColor Yellow }

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
Write-Host "Распознавание: $($h.asr.engine), $($h.asr.loaded)"
Write-Host "Ollama: $(if ($h.ollama.ok) { 'запущена, модель ' + $h.ollama.model } else { 'не отвечает' })"
Write-Host ''
Write-Host 'Готово. Сервер будет запускаться сам при входе в Windows.' -ForegroundColor Green
Write-Host 'На странице «Воспоминания» выберите «на этом компьютере» и введите пароль.'
Write-Host 'Первое распознавание дольше обычного: загружается модель.'

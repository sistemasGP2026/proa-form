<#
=======================================================================
 PROA - Despliegue en el servidor con PM2
=======================================================================
 Ejecutar EN EL SERVIDOR 10.10.1.24, en PowerShell COMO ADMINISTRADOR:

     powershell -ExecutionPolicy Bypass -File .\desplegar-servidor.ps1

 Que hace:
   1. Comprueba git, node, npm y pm2 (instala pm2 si falta).
   2. Clona el repositorio en la carpeta destino, o actualiza si ya esta.
   3. Crea el .env con el puerto y la cadena de Mongo. Si ya existe, NO
      lo toca: el .env nunca se sobrescribe ni se sube al repositorio.
   4. Instala dependencias y compila.
   5. Levanta la aplicacion con PM2 y la guarda para que reviva sola.
   6. Abre el puerto en el firewall y hace una prueba de humo.

 Parametros (todos opcionales):
   -Carpeta    carpeta destino        (por defecto C:\Users\Admis\Desktop\Proyectos GP)
   -Puerto     puerto HTTP            (por defecto 83)
   -MongoUri   cadena de conexion     (por defecto mongodb://127.0.0.1:27017/proa)
   -SinFirewall   no toca el firewall
   -SoloActualizar  omite el clon inicial; solo hace pull, build y reload

 NO borra datos. NO toca la base de datos. Con -Simular solo informa.
=======================================================================
#>

[CmdletBinding()]
param(
    [string]$Carpeta  = 'C:\Users\Admis\Desktop\Proyectos GP',
    [int]   $Puerto   = 83,
    [string]$MongoUri = 'mongodb://127.0.0.1:27017/proa',
    [switch]$SinFirewall,
    [switch]$SoloActualizar,
    [switch]$Simular
)

$ErrorActionPreference = 'Stop'
$REPO   = 'https://github.com/sistemasGP2026/proa-form.git'
$NOMBRE = 'proa-form'

function Escribir($t, $c = 'Gray') { Write-Host $t -ForegroundColor $c }
function Titulo($t) {
    Write-Host ''
    Write-Host ('-' * 68) -ForegroundColor DarkCyan
    Write-Host "  $t" -ForegroundColor Cyan
    Write-Host ('-' * 68) -ForegroundColor DarkCyan
}
function Existe($cmd) { [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }

# No se usa 'pm2 jlist | ConvertFrom-Json': esa salida trae claves que solo
# difieren en mayusculas (username / USERNAME) y ConvertFrom-Json de
# PowerShell 5.1 las toma por duplicadas y aborta. Se consulta a pm2 directo.
function Pm2Existe($nombre) {
    if (-not (Existe 'pm2')) { return $false }
    & pm2 describe $nombre *> $null
    return ($LASTEXITCODE -eq 0)
}
function Pm2Pid($nombre) {
    if (-not (Pm2Existe $nombre)) { return $null }
    $salida = & pm2 pid $nombre 2>$null
    $num = ($salida | Where-Object { $_ -match '^\s*\d+\s*$' } | Select-Object -Last 1)
    if ($num) { return [int]($num.Trim()) }
    return $null
}

$destino = Join-Path $Carpeta $NOMBRE

# ─────────────────────── 1. Requisitos ───────────────────────
Titulo 'Requisitos'

$admin = ([Security.Principal.WindowsPrincipal] `
          [Security.Principal.WindowsIdentity]::GetCurrent()
         ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if ($admin) { Escribir '  PowerShell con permisos de administrador.' 'Green' }
else { Escribir '  Sin permisos de administrador: el firewall no se podra abrir.' 'Yellow' }

foreach ($c in 'git','node','npm') {
    if (-not (Existe $c)) { throw "Falta '$c' en el servidor. Instalelo antes de continuar." }
}
$nodeV = (& node -v)
Escribir "  git  $(& git --version)" 'Green'
Escribir "  node $nodeV" 'Green'

$mayor = [int](($nodeV -replace '^v','') -split '\.')[0]
if ($mayor -lt 20) {
    throw "NestJS 11 requiere Node 20 o superior. Este servidor tiene $nodeV."
}

if (-not (Existe 'pm2')) {
    Escribir '  pm2 no esta instalado. Instalando...' 'Yellow'
    if (-not $Simular) {
        & npm install -g pm2
        if ($LASTEXITCODE -ne 0) { throw "No se pudo instalar pm2 (codigo $LASTEXITCODE)" }
    }
    $env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' +
                [Environment]::GetEnvironmentVariable('Path','User')
}
if (Existe 'pm2') { Escribir "  pm2  $(& pm2 -v)" 'Green' }

# ─────────────────────── 2. Puerto libre ───────────────────────
Titulo "Puerto $Puerto"
$enUso = Get-NetTCPConnection -State Listen -LocalPort $Puerto -ErrorAction SilentlyContinue
if ($enUso) {
    $pid_ = ($enUso | Select-Object -First 1).OwningProcess
    $proc = Get-Process -Id $pid_ -ErrorAction SilentlyContinue
    $mio = ((Pm2Pid $NOMBRE) -eq $pid_)
    if ($mio) { Escribir "  Ocupado por la propia aplicacion PROA (PID $pid_). Se reemplazara." 'Yellow' }
    else { throw "El puerto $Puerto lo ocupa '$($proc.ProcessName)' (PID $pid_), que no es PROA. Libere el puerto o use -Puerto otro." }
} else {
    Escribir "  Libre." 'Green'
}

# ─────────────────────── 3. Codigo ───────────────────────
Titulo 'Codigo fuente'
if (-not (Test-Path $Carpeta)) {
    if ($Simular) { Escribir "  (simulacion) se creria $Carpeta" 'Yellow' }
    else { New-Item -ItemType Directory -Path $Carpeta -Force | Out-Null }
}

if (Test-Path (Join-Path $destino '.git')) {
    Escribir "  Ya existe: $destino" 'Green'
    if (-not $Simular) {
        Push-Location $destino
        try {
            & git fetch origin
            $sucio = & git status --porcelain
            if ($sucio) {
                Escribir '  Hay cambios locales sin confirmar en el servidor:' 'Yellow'
                $sucio | ForEach-Object { Escribir "      $_" 'Yellow' }
                throw "Se cancela para no pisarlos. Reviselos y vuelva a ejecutar."
            }
            & git pull --ff-only origin main
            if ($LASTEXITCODE -ne 0) { throw "git pull fallo (codigo $LASTEXITCODE)" }
        } finally { Pop-Location }
    }
} elseif ($SoloActualizar) {
    throw "No hay repositorio en $destino y se pidio -SoloActualizar."
} else {
    Escribir "  Clonando en $destino" 'Gray'
    if (-not $Simular) {
        Push-Location $Carpeta
        try {
            & git clone $REPO $NOMBRE
            if ($LASTEXITCODE -ne 0) { throw "git clone fallo (codigo $LASTEXITCODE)" }
        } finally { Pop-Location }
    }
}
Escribir "  Commit actual: $(if ($Simular) { '(simulacion)' } else { (& git -C $destino log --oneline -1) })" 'DarkGray'

# ─────────────────────── 4. .env ───────────────────────
Titulo 'Configuracion (.env)'
$rutaEnv = Join-Path $destino '.env'
if (Test-Path $rutaEnv) {
    Escribir '  Ya existe. NO se modifica.' 'Green'
    $actual = Get-Content $rutaEnv | Where-Object { $_ -match '^\s*PORT\s*=' } | Select-Object -Last 1
    if ($actual) { Escribir "  $actual" 'DarkGray' }
    if ($actual -and ($actual -notmatch "=\s*$Puerto\s*$")) {
        Escribir "  AVISO: el .env no apunta al puerto $Puerto. Ajustelo a mano si hace falta." 'Yellow'
    }
} else {
    # Secreto nuevo y aleatorio: no se reutiliza el de desarrollo.
    $bytes = New-Object byte[] 48
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $secreto = [Convert]::ToBase64String($bytes)

    $contenido = @"
# Generado por desplegar-servidor.ps1 - NO se sube al repositorio
PORT=$Puerto
MONGODB_URI=$MongoUri
JWT_SECRET=$secreto
JWT_EXPIRES=8h
NODE_ENV=production
"@
    if ($Simular) { Escribir '  (simulacion) se creria el .env' 'Yellow' }
    else {
        [IO.File]::WriteAllText($rutaEnv, $contenido, (New-Object Text.UTF8Encoding $false))
        Escribir "  Creado con PORT=$Puerto y un JWT_SECRET nuevo." 'Green'
        Escribir '  El secreto queda solo en este archivo; no se imprime ni se sube.' 'DarkGray'
    }
}

# ─────────────────────── 5. Dependencias y compilacion ───────────────────────
Titulo 'Dependencias y compilacion'
if ($Simular) { Escribir '  (simulacion) npm ci + npm run build' 'Yellow' }
else {
    Push-Location $destino
    try {
        & npm ci
        if ($LASTEXITCODE -ne 0) {
            Escribir '  npm ci fallo; se intenta npm install.' 'Yellow'
            & npm install
            if ($LASTEXITCODE -ne 0) {
                throw "No se pudieron instalar las dependencias. Si el error menciona 'bcrypt' o 'node-gyp', faltan las herramientas de compilacion de Visual Studio en el servidor."
            }
        }
        if (Test-Path 'dist') { Remove-Item 'dist' -Recurse -Force }
        & npm run build
        if ($LASTEXITCODE -ne 0) { throw "La compilacion fallo (codigo $LASTEXITCODE)" }
        Escribir '  Compilacion correcta.' 'Green'
    } finally { Pop-Location }
}

# ─────────────────────── 6. PM2 ───────────────────────
Titulo 'PM2'
# La aplicacion lee el .env del directorio de trabajo: por eso se fija cwd.
$eco = @"
// Generado por desplegar-servidor.ps1
module.exports = {
  apps: [{
    name: '$NOMBRE',
    script: 'dist/main.js',
    cwd: __dirname,          // la app lee el .env desde aqui
    instances: 1,
    autorestart: true,
    max_memory_restart: '400M',
    env: { NODE_ENV: 'production' },
  }],
};
"@
$rutaEco = Join-Path $destino 'ecosystem.config.js'
if ($Simular) { Escribir '  (simulacion) se escribiria ecosystem.config.js y se arrancaria' 'Yellow' }
else {
    [IO.File]::WriteAllText($rutaEco, $eco, (New-Object Text.UTF8Encoding $false))

    Push-Location $destino
    try {
        # startOrReload: arranca si no estaba, recarga si ya corria.
        & pm2 startOrReload ecosystem.config.js --update-env
        if ($LASTEXITCODE -ne 0) { throw "pm2 devolvio el codigo $LASTEXITCODE" }
        Escribir '  Aplicacion en marcha.' 'Green'
        & pm2 save
    } finally { Pop-Location }
}

# ─────────────────────── 7. Firewall ───────────────────────
Titulo 'Firewall'
if ($SinFirewall) { Escribir '  Omitido por -SinFirewall.' 'Yellow' }
elseif (-not $admin) { Escribir '  Se necesita PowerShell como administrador. Omitido.' 'Yellow' }
elseif ($Simular) { Escribir '  (simulacion) se abriria el puerto' 'Yellow' }
else {
    $regla = "PROA $Puerto"
    if (Get-NetFirewallRule -DisplayName $regla -ErrorAction SilentlyContinue) {
        Escribir "  La regla '$regla' ya existe." 'Green'
    } else {
        New-NetFirewallRule -DisplayName $regla -Direction Inbound -Protocol TCP `
            -LocalPort $Puerto -Action Allow -Profile Any | Out-Null
        Escribir "  Regla '$regla' creada (TCP $Puerto entrante)." 'Green'
    }
}

# ─────────────────────── 8. Prueba de humo ───────────────────────
Titulo 'Prueba'
if ($Simular) { Escribir '  (simulacion)' 'Yellow' }
else {
    Start-Sleep -Seconds 5
    $ok = $false
    foreach ($intento in 1..6) {
        try {
            $r = Invoke-WebRequest -Uri "http://localhost:$Puerto/form" -UseBasicParsing -TimeoutSec 10
            if ($r.StatusCode -eq 200) { $ok = $true; break }
        } catch { Start-Sleep -Seconds 3 }
    }
    if ($ok) {
        Escribir "  http://localhost:$Puerto/form responde 200." 'Green'
        $ip = (Get-NetIPAddress -AddressFamily IPv4 |
               Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } |
               Select-Object -First 1).IPAddress
        Escribir "  Desde la red:  http://$ip`:$Puerto/form" 'Green'
    } else {
        Escribir '  No respondio. Revise:  pm2 logs proa-form --lines 50' 'Red'
    }
}

Titulo 'Listo'
Write-Host @"
  Comandos utiles:

      pm2 status                      estado de la aplicacion
      pm2 logs $NOMBRE --lines 50     ver los ultimos errores
      pm2 restart $NOMBRE             reiniciar
      pm2 reload $NOMBRE              reiniciar sin cortar peticiones

  Para actualizar cuando suba cambios a GitHub, desde esta misma carpeta:

      powershell -ExecutionPolicy Bypass -File .\desplegar-servidor.ps1 -SoloActualizar

  Si no puede iniciar sesion porque la base no tiene usuarios:

      cd "$destino"
      npm run seed

  Para que la aplicacion arranque sola al reiniciar el servidor
  (Windows necesita un paso extra que pm2 no hace solo):

      npm install -g pm2-windows-startup
      pm2-startup install
      pm2 save

"@ -ForegroundColor White

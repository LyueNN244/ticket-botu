# PowerShell script to reorganize assets in astenya-site-v2-git

$baseDir = "c:\Users\Yigit\Desktop\astenya-site-v2-git"
$imgDir = "$baseDir\img"
$tanrilarDir = "$imgDir\tanrilar"
$mapDir = "$imgDir\map"

# Create directories
Write-Host "Creating directories..."
New-Item -ItemType Directory -Force -Path $imgDir
New-Item -ItemType Directory -Force -Path $tanrilarDir
New-Item -ItemType Directory -Force -Path $mapDir

# Move and rename main seal
Write-Host "Moving seal..."
if (Test-Path "$baseDir\muhur.png") {
    Move-Item -Path "$baseDir\muhur.png" -Destination "$imgDir\tanrimuhur.png" -Force
}

# Delete broken 2-byte seal
if (Test-Path "$baseDir\tanrımuhur.png") {
    Remove-Item -Path "$baseDir\tanrımuhur.png" -Force
}

# Move and rename background
Write-Host "Moving background..."
if (Test-Path "$baseDir\arkaplan.png") {
    Move-Item -Path "$baseDir\arkaplan.png" -Destination "$imgDir\arkaplan.png" -Force
}

# Move and rename 14 god image files
Write-Host "Moving and renaming gods..."
$gods = @("Casemir", "Emparos", "Leopolde", "Magiena", "Malafez", "Merinos", "Miu", "Osentha", "Sima", "Thorgin", "Vespadora", "Warnar", "X", "Xanax")
foreach ($god in $gods) {
    $srcPath = "$baseDir\$god.png"
    $destPath = "$tanrilarDir\$($god.ToLower()).png"
    if (Test-Path $srcPath) {
        Move-Item -Path $srcPath -Destination $destPath -Force
        Write-Host "Moved: $god.png -> img/tanrilar/$($god.ToLower()).png"
    } else {
        Write-Warning "File not found: $srcPath"
    }
}

# Move and rename map files
Write-Host "Moving and renaming map files..."
$mapFiles = @{
    "anamap.png" = "anamap.png"
    "azure-kralligi.png" = "azure-kralligi.png"
    "bladion gece toprakları.png" = "bladion-gece-topraklari.png"
    "buyucu kulesı.png" = "buyucu-kulesi.png"
    "dragian.png" = "dragian.png"
    "elf.png" = "elf.png"
    "kavi.png" = "kavi.png"
    "lemartha kutsal krallık.png" = "lemartha-kutsal-krallik.png"
    "yikim-mahzeni.png" = "yikim-mahzeni.png"
}

foreach ($key in $mapFiles.Keys) {
    $srcPath = "$baseDir\map\$key"
    $destPath = "$mapDir\$($mapFiles[$key])"
    if (Test-Path $srcPath) {
        Move-Item -Path $srcPath -Destination $destPath -Force
        Write-Host "Moved map file: $key -> img/map/$($mapFiles[$key])"
    } else {
        Write-Warning "Map file not found: $srcPath"
    }
}

# Delete old map folder if empty
if (Test-Path "$baseDir\map") {
    Remove-Item -Path "$baseDir\map" -Recurse -Force
    Write-Host "Deleted old map folder."
}

Write-Host "Reorganization complete!"

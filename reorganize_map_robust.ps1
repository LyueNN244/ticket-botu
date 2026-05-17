# Robust PowerShell script to reorganize map files using encoding-safe wildcard matches

$baseDir = "c:\Users\Yigit\Desktop\astenya-site-v2-git"
$mapDir = "$baseDir\img\map"

Write-Host "Reorganizing map files with robust matches..."

$files = Get-ChildItem -Path "$baseDir\map"
foreach ($f in $files) {
    $name = $f.Name.ToLower()
    $destName = ""

    if ($name -like "*anamap*") {
        $destName = "anamap.png"
    } elseif ($name -like "*azure*") {
        $destName = "azure-kralligi.png"
    } elseif ($name -like "*bladion*") {
        $destName = "bladion-gece-topraklari.png"
    } elseif ($name -like "*buyucu*") {
        $destName = "buyucu-kulesi.png"
    } elseif ($name -like "*dragian*") {
        $destName = "dragian.png"
    } elseif ($name -like "*elf*") {
        $destName = "elf.png"
    } elseif ($name -like "*kavi*") {
        $destName = "kavi.png"
    } elseif ($name -like "*lemartha*") {
        $destName = "lemartha-kutsal-krallik.png"
    } elseif ($name -like "*yikim*") {
        $destName = "yikim-mahzeni.png"
    }

    if ($destName -ne "") {
        Move-Item -Path $f.FullName -Destination "$mapDir\$destName" -Force
        Write-Host "Moved: $($f.Name) -> img/map/$destName"
    } else {
        Write-Warning "Unmatched file: $($f.Name)"
    }
}

# Delete the old map folder if empty
if (Test-Path "$baseDir\map") {
    Remove-Item -Path "$baseDir\map" -Recurse -Force
    Write-Host "Deleted old map folder."
}

Write-Host "Robust reorganization complete!"

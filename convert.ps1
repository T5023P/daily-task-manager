Add-Type -AssemblyName System.Drawing

# Convert 192 icon
Write-Host "Converting 192 icon..."
$img192 = [System.Drawing.Image]::FromFile('public/icon-192x192.png')
$img192.Save('public/icon-192x192.png.tmp', [System.Drawing.Imaging.ImageFormat]::Png)
$img192.Dispose()
Remove-Item -Force public/icon-192x192.png
Move-Item -Force public/icon-192x192.png.tmp public/icon-192x192.png

# Convert 512 icon
Write-Host "Converting 512 icon..."
$img512 = [System.Drawing.Image]::FromFile('public/icon-512x512.png')
$img512.Save('public/icon-512x512.png.tmp', [System.Drawing.Imaging.ImageFormat]::Png)
$img512.Dispose()
Remove-Item -Force public/icon-512x512.png
Move-Item -Force public/icon-512x512.png.tmp public/icon-512x512.png

Write-Host "Conversion completed successfully!"

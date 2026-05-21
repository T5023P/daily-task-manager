Add-Type -AssemblyName System.Drawing

$srcPath = "public\icon-512x512.png"
$src = [System.Drawing.Image]::FromFile((Resolve-Path $srcPath))
Write-Host "Source icon dimensions: $($src.Width)x$($src.Height)"

# Resize to 512x512
$bmp512 = New-Object System.Drawing.Bitmap(512, 512)
$g512 = [System.Drawing.Graphics]::FromImage($bmp512)
$g512.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g512.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g512.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g512.DrawImage($src, 0, 0, 512, 512)
$g512.Dispose()
$bmp512.Save("public\icon-512x512-new.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp512.Dispose()
Write-Host "Created 512x512 icon"

# Resize to 384x384
$bmp384 = New-Object System.Drawing.Bitmap(384, 384)
$g384 = [System.Drawing.Graphics]::FromImage($bmp384)
$g384.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g384.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g384.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g384.DrawImage($src, 0, 0, 384, 384)
$g384.Dispose()
$bmp384.Save("public\icon-384x384.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp384.Dispose()
Write-Host "Created 384x384 icon"

# Resize to 192x192
$bmp192 = New-Object System.Drawing.Bitmap(192, 192)
$g192 = [System.Drawing.Graphics]::FromImage($bmp192)
$g192.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g192.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g192.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g192.DrawImage($src, 0, 0, 192, 192)
$g192.Dispose()
$bmp192.Save("public\icon-192x192-new.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp192.Dispose()
Write-Host "Created 192x192 icon"

# Resize to 144x144
$bmp144 = New-Object System.Drawing.Bitmap(144, 144)
$g144 = [System.Drawing.Graphics]::FromImage($bmp144)
$g144.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g144.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g144.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g144.DrawImage($src, 0, 0, 144, 144)
$g144.Dispose()
$bmp144.Save("public\icon-144x144.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp144.Dispose()
Write-Host "Created 144x144 icon"

# Resize to 96x96
$bmp96 = New-Object System.Drawing.Bitmap(96, 96)
$g96 = [System.Drawing.Graphics]::FromImage($bmp96)
$g96.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g96.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g96.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g96.DrawImage($src, 0, 0, 96, 96)
$g96.Dispose()
$bmp96.Save("public\icon-96x96.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp96.Dispose()
Write-Host "Created 96x96 icon"

# Resize to 72x72
$bmp72 = New-Object System.Drawing.Bitmap(72, 72)
$g72 = [System.Drawing.Graphics]::FromImage($bmp72)
$g72.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g72.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g72.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g72.DrawImage($src, 0, 0, 72, 72)
$g72.Dispose()
$bmp72.Save("public\icon-72x72.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp72.Dispose()
Write-Host "Created 72x72 icon"

# Resize to 48x48
$bmp48 = New-Object System.Drawing.Bitmap(48, 48)
$g48 = [System.Drawing.Graphics]::FromImage($bmp48)
$g48.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g48.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g48.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g48.DrawImage($src, 0, 0, 48, 48)
$g48.Dispose()
$bmp48.Save("public\icon-48x48.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp48.Dispose()
Write-Host "Created 48x48 icon"

$src.Dispose()

# Replace originals
Move-Item -Force "public\icon-512x512-new.png" "public\icon-512x512.png"
Move-Item -Force "public\icon-192x192-new.png" "public\icon-192x192.png"
Write-Host "Replaced original icon files with properly sized versions."
Write-Host "All icons generated successfully!"

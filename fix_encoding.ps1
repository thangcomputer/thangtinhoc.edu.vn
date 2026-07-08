$files = @('client\.env.production', 'admin\.env.production', 'deploy\rebuild-frontend.sh', 'deploy\nginx\site.conf.template', 'deploy\nginx\admin.conf.template')
foreach ($f in $files) {
    $path = Join-Path 'c:\Users\thang\Desktop\WEB' $f
    if (Test-Path $path) {
        $text = Get-Content $path -Raw
        [System.IO.File]::WriteAllText($path, $text, [System.Text.Encoding]::UTF8)
    }
}

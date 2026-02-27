$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:5173/")
$listener.Start()
Write-Output "http://localhost:5173/"
while ($true) {
  $context = $listener.GetContext()
  $request = $context.Request
  $response = $context.Response
  $path = if ($request.Url.AbsolutePath -eq "/") { "index.html" } else { $request.Url.AbsolutePath.TrimStart("/") }
  $file = Join-Path $PSScriptRoot $path
  if (Test-Path $file) {
    $bytes = [System.IO.File]::ReadAllBytes($file)
    $contentType = "text/html"
    $ext = [System.IO.Path]::GetExtension($file).ToLower()
    if ($ext -eq ".js") { $contentType = "text/javascript" }
    if ($ext -eq ".css") { $contentType = "text/css" }
    $response.ContentType = $contentType
    $response.OutputStream.Write($bytes,0,$bytes.Length)
  } else {
    $response.StatusCode = 404
    $bytes = [System.Text.Encoding]::UTF8.GetBytes("Not Found")
    $response.OutputStream.Write($bytes,0,$bytes.Length)
  }
  $response.Close()
} 

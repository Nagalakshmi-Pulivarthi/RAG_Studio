# Free port 8000 (and 8001) so the RAG server can bind. Run this if you get "address already in use".
# Usage: .\kill-port-8000.ps1

$ports = @(8000, 8001)
foreach ($port in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($c in $conns) {
        $pid = $c.OwningProcess
        $name = (Get-Process -Id $pid -ErrorAction SilentlyContinue).ProcessName
        Write-Host "Stopping PID $pid ($name) on port $port"
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "Done. You can now run: .\venv\Scripts\python.exe -m uvicorn app.main:app"

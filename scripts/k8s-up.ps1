# Docker Desktop Kubernetes: imagens locais ficam visiveis ao cluster.
# Ingress: classe 'nginx'. Use -InstallIngress para aplicar ingress-nginx se ainda nao existir.
param(
    [switch]$InstallIngress
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$IngressNginxUrl = "https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.3/deploy/static/provider/cloud/deploy.yaml"

function Test-IngressClassNginx {
    $out = kubectl get ingressclass nginx 2>$null
    return ($LASTEXITCODE -eq 0)
}

Write-Host "Construindo imagens (backend producao + frontend nginx)..."
docker build -t filehub-backend:latest -f (Join-Path $RepoRoot "backend\Dockerfile.prod") (Join-Path $RepoRoot "backend")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker build -t filehub-frontend:latest -f (Join-Path $RepoRoot "frontend\Dockerfile.prod") (Join-Path $RepoRoot "frontend")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if ($InstallIngress) {
    Write-Host "Instalando Ingress NGINX..."
    kubectl apply -f $IngressNginxUrl
    kubectl wait --namespace ingress-nginx --for=condition=ready pod -l app.kubernetes.io/component=controller --timeout=180s 2>$null
}
elseif (-not (Test-IngressClassNginx)) {
    Write-Host ""
    Write-Host "[AVISO] Nao existe IngressClass 'nginx'. O Ingress filehub sera ignorado ate instalar um controller." -ForegroundColor Yellow
    Write-Host "  Opcao A: .\scripts\k8s-up.ps1 -InstallIngress"
    Write-Host "  Opcao B: kubectl port-forward -n filehub svc/frontend 8080:80  → http://127.0.0.1:8080"
    Write-Host ""
}

Write-Host "Aplicando manifests (kustomize)..."
kubectl apply -k (Join-Path $RepoRoot "k8s")

Write-Host "Aguardando rollouts..."
kubectl rollout status deployment/backend -n filehub --timeout=180s
kubectl rollout status deployment/frontend -n filehub --timeout=120s

Write-Host ""
Write-Host "Ingress (namespace filehub):" -ForegroundColor Cyan
kubectl get ingress filehub-ingress -n filehub -o wide
Write-Host ""
Write-Host "Abra no navegador (sem editar hosts):" -ForegroundColor Green
Write-Host "  http://localhost   ou   http://127.0.0.1"

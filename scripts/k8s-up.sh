#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INGRESS_URL="https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.3/deploy/static/provider/cloud/deploy.yaml"

echo "Construindo imagens (backend producao + frontend nginx)..."
docker build -t filehub-backend:latest -f "$ROOT/backend/Dockerfile.prod" "$ROOT/backend"
docker build -t filehub-frontend:latest -f "$ROOT/frontend/Dockerfile.prod" "$ROOT/frontend"

if [[ "${INSTALL_INGRESS:-}" == "1" ]]; then
  echo "Instalando Ingress NGINX..."
  kubectl apply -f "$INGRESS_URL"
  kubectl wait --namespace ingress-nginx --for=condition=ready pod -l app.kubernetes.io/component=controller --timeout=180s || true
elif ! kubectl get ingressclass nginx &>/dev/null; then
  echo ""
  echo "[AVISO] Nao existe IngressClass 'nginx'."
  echo "  INSTALL_INGRESS=1 $0   ou   kubectl port-forward -n filehub svc/frontend 8080:80"
  echo ""
fi

echo "Aplicando manifests..."
kubectl apply -k "$ROOT/k8s"

echo "Aguardando rollouts..."
kubectl rollout status deployment/backend -n filehub --timeout=180s
kubectl rollout status deployment/frontend -n filehub --timeout=120s

echo ""
kubectl get ingress filehub-ingress -n filehub -o wide || true
echo "Abrir: http://filehub.local (com hosts) ou use port-forward no svc/frontend:8080"

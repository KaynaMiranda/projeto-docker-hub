@echo off
setlocal enabledelayedexpansion

set ACR_NAME=%~1
if "%ACR_NAME%"=="" set ACR_NAME=filehub
set NAMESPACE=filehub

echo === Building backend image ===
docker build -t %ACR_NAME%.azurecr.io/filehub-backend:latest -f backend/Dockerfile.prod backend/
if %errorlevel% neq 0 exit /b %errorlevel%

echo === Building frontend image ===
docker build ^
  --build-arg VITE_API_URL="" ^
  -t %ACR_NAME%.azurecr.io/filehub-frontend:latest ^
  -f frontend/Dockerfile.prod frontend/
if %errorlevel% neq 0 exit /b %errorlevel%

echo === Pushing images ===
docker push %ACR_NAME%.azurecr.io/filehub-backend:latest
docker push %ACR_NAME%.azurecr.io/filehub-frontend:latest

echo === Deploying to Kubernetes ===
kubectl apply -k k8s/

echo === Waiting for migration job ===
kubectl wait --for=condition=complete --timeout=120s job/db-migrate -n %NAMESPACE%

echo === Restarting backend after migration ===
kubectl rollout restart deployment/backend -n %NAMESPACE%

echo === Done ===
echo Run: kubectl get ingress -n %NAMESPACE%

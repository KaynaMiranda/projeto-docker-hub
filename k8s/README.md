# Kubernetes (local)

Fluxo esperado: com **Ingress** no Docker Desktop, abra **http://localhost** ou **http://127.0.0.1** — o manifesto `10-ingress.yaml` usa regra **sem `host`**, então **não é obrigatório** editar o arquivo `hosts` para `filehub.local`. Para port-forward no Service do front (porta 8080), use `scripts/k8s-port-forward.ps1`. O front usa **URLs relativas** (`VITE_API_URL` vazio). O nginx na imagem do front encaminha `/files`, `/shares`, `/ai-results` e `/health` para o Service `backend`.

## Pré-requisitos

1. Cluster local (Docker Desktop Kubernetes ou equivalente).
2. **Ingress NGINX** com `IngressClass` nomeada `nginx`. Exemplo rápido (Helm):

   ```bash
   helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
   helm repo update
   helm install ingress-nginx ingress-nginx/ingress-nginx \
     --create-namespace \
     --namespace ingress-nginx
   ```

3. `kubectl` apontando para o cluster correto.

## Subir

No Windows, a partir da raiz do repositório (**Docker Desktop** rodando):

```powershell
.\scripts\k8s-up.ps1 -InstallIngress   # primeira vez: instala controller + aplicacao
.\scripts\k8s-up.ps1                   # depois disso (ou se o Ingress ja existir)

# Sem Ingress instalado — UI + API pelo proxy do nginx:
.\scripts\k8s-port-forward.ps1         # ou: kubectl port-forward -n filehub svc/frontend 8080:80
```

Ou manualmente (use **Dockerfile.prod** no backend):

```bash
docker build -t filehub-backend:latest -f backend/Dockerfile.prod ./backend
docker build -t filehub-frontend:latest -f frontend/Dockerfile.prod ./frontend
kubectl apply -k ./k8s
```

Ingress ainda não instalado: `powershell -ExecutionPolicy Bypass -File ./scripts/k8s-up.ps1 -InstallIngress`

Ambiente Docker Desktop Kubernetes: não é necessário dar push das imagens; o `kubectl` deve usar os tags locais com `imagePullPolicy: IfNotPresent` / `Never` conforme seus manifests.

## Endereço no navegador

- **http://localhost** ou **http://127.0.0.1** (recomendado; sem `hosts`).
- Opcional: `127.0.0.1 filehub.local` no arquivo `hosts` e **http://filehub.local** (requer execução como administrador no Windows).

```bash
kubectl get ingress filehub-ingress -n filehub
```

Não monte a imagem do front com `VITE_API_URL=http://localhost:3000` no Kubernetes.

## Alternativa rápida (sem Ingress)

Se o Ingress não estiver disponível, apenas o frontend com nginx ainda faz proxy para o backend no cluster:

```bash
kubectl port-forward -n filehub svc/frontend 8080:80
```

Acesse `http://127.0.0.1:8080`; as chamadas a `/files` etc. continuam sendo atendidas pelo nginx do pod para o Service `backend`.

# Lakshmanan Portfolio — Full-Stack DevOps Project

A personal portfolio site upgraded into a real 3-tier deployment:

```
Browser → Frontend (nginx, static HTML/CSS/JS) → Backend (Node/Express API) → MongoDB Atlas
```

Everything is containerized and ships with Kubernetes manifests, so this doubles as a
DevOps portfolio piece, not just a personal site.

## Architecture

- **frontend/** — the static site (unchanged design), served by nginx. Project cards
  and contact form now talk to the backend API instead of a static JSON file / Web3Forms.
- **backend/** — Express API with two resources:
  - `GET /api/projects` (public) — projects pulled from MongoDB Atlas
  - `POST /api/contact` (public, rate-limited) — saves contact form submissions to Atlas
  - `POST/PUT/DELETE /api/projects` and `GET /api/contact` (protected by `x-admin-key` header)
  - `/healthz`, `/readyz` — Kubernetes liveness/readiness probes
- **k8s/** — Deployments, Services, ConfigMap, Secret template, HPA, and an optional Ingress
- **.github/workflows/ci-cd.yml** — builds and pushes both images to Docker Hub on every push to `main`

## 1. Set up MongoDB Atlas

1. In your Atlas project, create a free (or existing) cluster.
2. **Database Access** → add a database user with a strong password.
3. **Network Access** → allow access from wherever your cluster will connect from
   (for a first pass, `0.0.0.0/0` is easiest; lock it down once you know your cluster's
   egress IPs).
4. **Database → Connect → Drivers → Node.js** → copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/portfolio?retryWrites=true&w=majority
   ```

## 2. Run it locally first

```bash
cd backend
cp .env.example .env
# paste your MONGODB_URI into .env, and generate an ADMIN_API_KEY:
#   openssl rand -hex 32
npm install
npm run seed     # loads your 4 existing projects into Atlas
npm run dev       # starts the API on http://localhost:5000
```

In another terminal, open `frontend/index.html` directly, or serve it:
```bash
cd frontend
python3 -m http.server 8080
```
Since there's no nginx proxy running locally, edit `frontend/config.js` and set:
```js
API_BASE_URL: "http://localhost:5000/api"
```
(Revert it to `"/api"` before building the production image — nginx handles the
proxy in that case.)

Or skip both of the above and just run:
```bash
docker compose up --build
```
which builds both images and wires them together exactly as they'll run in Kubernetes
(frontend on http://localhost:8080, backend on http://localhost:5000).

## 3. Build and push the images

```bash
docker build -t YOUR_REGISTRY/portfolio-backend:latest ./backend
docker build -t YOUR_REGISTRY/portfolio-frontend:latest ./frontend
docker push YOUR_REGISTRY/portfolio-backend:latest
docker push YOUR_REGISTRY/portfolio-frontend:latest
```
Or just push to `main` — the included GitHub Actions workflow does this for you once you
add `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` as repo secrets.

Then update the `image:` field in `k8s/03-backend-deployment.yaml` and
`k8s/05-frontend-deployment.yaml` to match.

## 4. Deploy to Kubernetes

Works the same whether that's minikube/kind locally or a cloud cluster (EKS/AKS/GKE) —
nothing in these manifests is cloud-specific except the `LoadBalancer` Service type,
which minikube handles via `minikube service`.

```bash
kubectl apply -f k8s/00-namespace.yaml

# Create the secret (don't commit real values — see the .example file)
cp k8s/01-secret.yaml.example k8s/01-secret.yaml
# edit k8s/01-secret.yaml with your real MONGODB_URI and ADMIN_API_KEY
kubectl apply -f k8s/01-secret.yaml

kubectl apply -f k8s/02-configmap.yaml
kubectl apply -f k8s/03-backend-deployment.yaml
kubectl apply -f k8s/04-backend-service.yaml
kubectl apply -f k8s/05-frontend-deployment.yaml
kubectl apply -f k8s/06-frontend-service.yaml
kubectl apply -f k8s/08-backend-hpa.yaml   # requires metrics-server

# check everything came up
kubectl get pods -n portfolio
kubectl get svc -n portfolio
```

On minikube, reach the site with:
```bash
minikube service frontend-service -n portfolio
```

Once you have a real domain, rename `k8s/07-ingress.yaml.example` to
`07-ingress.yaml`, set your hostname, and `kubectl apply -f k8s/07-ingress.yaml`
(requires an ingress controller like ingress-nginx installed on the cluster).

## 5. Seed / manage projects in production

The seed script can be re-run against the Atlas cluster from anywhere with the same
`MONGODB_URI`:
```bash
cd backend
npm run seed
```
Or manage projects via the protected API once deployed:
```bash
curl -X POST https://your-domain/api/projects \
  -H "Content-Type: application/json" \
  -H "x-admin-key: YOUR_ADMIN_API_KEY" \
  -d '{"title": "...", "description": "...", "link": "...", "tech": ["..."]}'
```

## Notes / things to tighten before treating this as production-grade

- `ALLOWED_ORIGIN` in `k8s/02-configmap.yaml` is `*` by default — restrict it to your
  real frontend origin once you have one.
- Atlas network access starting at `0.0.0.0/0` should be narrowed to your cluster's
  actual egress IPs.
- The admin API key is a simple shared secret, fine for a personal project; swap for
  real auth (JWT, OAuth) if this ever needs multiple users/roles.

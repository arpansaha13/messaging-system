# Helm + Skaffold Dev Setup

This directory contains the Kubernetes dev replacement for the Compose `app` profile.

## Prerequisites

- Kubernetes context set to `docker-desktop`
- `kubectl` installed
- `helm` installed
- `skaffold` installed

## Install ingress-nginx (one-time)

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=180s
```

## Run dev stack

From repository root:

```bash
skaffold dev -p docker-desktop
```

The deploy hook automatically generates and applies:

- `ConfigMap/messaging-env`
- `Secret/messaging-secret`

from local `.env` via `infra/helm/scripts/apply-env.sh`.

## Local access

Skaffold port-forwarding maps:

- ingress (HTTP): `http://localhost:7000`
- backend API: `http://localhost:7030`
- auth-db: `localhost:7010`
- postgres: `localhost:7020`
- user-db: `localhost:7040`
- rabbitmq management: `http://localhost:7050`

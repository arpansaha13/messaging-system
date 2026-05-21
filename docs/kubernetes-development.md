# Kubernetes Development Environment

This document provides instructions and commands for running the development environment using Skaffold and accessing the Headlamp UI.

---

## 1. Running the Dev Server (Skaffold)

To run the development server such that all built images are automatically pruned/cleaned up from your local Docker daemon when Skaffold closes:

```bash
skaffold dev --no-prune=false --cache-artifacts=false
```

### Explanation of Flags:
- `--no-prune=false`: Instructs Skaffold to delete the images it built during the session once the process exits (via `Ctrl+C`).
- `--cache-artifacts=false`: Required because Skaffold only prunes built images when artifact caching is disabled.

---

## 2. Accessing the Headlamp UI

Since Headlamp is deployed in-cluster, you need to port-forward the service to access the UI and generate a service account token to authenticate.

### Step 1: Port-Forward the Headlamp Service
Run the following command to expose Headlamp locally on port `8080`:

```bash
kubectl port-forward -n kube-system service/headlamp 8080:80
```

Once running, open your web browser and navigate to:
[http://localhost:8080](http://localhost:8080)

### Step 2: Generate an Authentication Token
Headlamp requires an access token to authenticate. Run the following command to generate a temporary token for the `headlamp` service account:

```bash
kubectl create token headlamp --namespace kube-system
```

Copy the generated token from the console output and paste it into the Headlamp login page to gain access to the cluster dashboard.

---

## 3. Resetting / Clearing Database Volumes

If you need to clear the databases and start with a fresh database setup:

### Option A: Clean Reset (Skaffold Closed)
1. Stop the running `skaffold dev` process (using `Ctrl+C`).
2. Delete the local hostPath directories on your Mac:
   ```bash
   rm -rf /tmp/messaging-system-k8s
   ```
3. Restart the dev environment:
   ```bash
   skaffold dev --no-prune=false --cache-artifacts=false
   ```

### Option B: Live Reset (While Skaffold is Running)
You can reset individual databases without stopping `skaffold dev`. For example, to reset `postgres`:
1. Delete the specific database directory on your host:
   ```bash
   rm -rf /tmp/messaging-system-k8s/postgres
   ```
2. Force-delete the corresponding pod to trigger a recreation:
   ```bash
   kubectl delete pod postgres-0 -n messaging-dev
   ```
   *(Note: Pod names are `postgres-0`, `auth-db-0`, `user-db-0`, and `rabbitmq-0`)*


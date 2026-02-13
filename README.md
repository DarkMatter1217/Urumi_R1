
# 🛒 Urumi Store Orchestration Platform

A Kubernetes-native multi-tenant WooCommerce provisioning platform built for the **Urumi AI SDE Internship – Round 1**.

This system allows users to dynamically provision fully functional, isolated WooCommerce stores using a React dashboard and a Node.js backend powered by Helm.

---

#  Architecture Overview

The platform consists of three core components:

```
URUMI/
├── backend/              → Node.js provisioning API
├── dashboard/            → React UI
├── woocommerce-store/    → Helm chart (store infrastructure)
```

---

## 🔹 1. Backend (Node.js)

* Exposes REST APIs for:

  * Create Store
  * Delete Store
  * List Stores
  * View Events
* Executes Helm installs dynamically
* Manages concurrency (max 2 parallel installs)
* Tracks lifecycle events:

  * Provisioning started
  * Helm started
  * WordPress ready
  * Failure reasons
  * Deletion lifecycle
* Performs clean teardown via Helm uninstall + namespace deletion

---

## 🔹 2. Dashboard (React)

Provides:

* Create New Store
* View store status (Provisioning / Ready / Failed)
* Open Store URL
* Delete Store
* View provisioning lifecycle events (observability)

---

## 🔹 3. Helm Chart (woocommerce-store)

Each store is deployed into its **own namespace** with:

* WordPress Deployment
* MySQL StatefulSet
* Persistent Volume Claim
* Ingress (store-id.localtest.me)
* NetworkPolicy
* ResourceQuota
* LimitRange
* Bootstrap Job (post-install hook)

---

# 🔐 Isolation Model

Each store gets:

* Dedicated namespace
* Dedicated database
* Dedicated PVC
* Resource quotas
* Network policies

This ensures tenant isolation and clean teardown.

---

# Provisioning Flow

1. User clicks **Create Store**
2. Backend:

   * Generates unique namespace
   * Runs `helm install`
3. Helm deploys:

   * WordPress
   * MySQL
   * Storage
4. Bootstrap Job:

   * Installs WordPress core
   * Installs WooCommerce
   * Creates default pages
   * Sets homepage to Shop
   * Seeds demo product
   * Enables COD
   * Disables "Coming Soon"
5. Store becomes Ready

---

# 🧾 Observability

Each store tracks lifecycle events:

Example:

```
[2026-02-13T14:35:13Z] Store provisioning started
[2026-02-13T14:35:13Z] Helm install started
[2026-02-13T14:35:45Z] WordPress pod running
[2026-02-13T14:35:46Z] Store marked Ready
```

Events are exposed via:

```
GET /stores/:id/events
```

Displayed in dashboard under "View Events".

---

# End-to-End Order Flow

Each provisioned store supports:

* Product listing
* Add to cart
* Checkout (Cash on Delivery)
* Order visible in WooCommerce admin

No manual setup required.

---

#  Clean Teardown

On Delete:

* `helm uninstall`
* Namespace deletion
* All resources removed (Pods, PVC, Ingress, Secrets)

No orphan infrastructure remains.

---

# Local Setup

## Requirements

* Docker
* kubectl
* Helm
* k3d (or any local Kubernetes cluster)
* Node.js
* npm

---

## 1️ Start Kubernetes Cluster (k3d example)

```bash
k3d cluster create urumi \
  --disable=traefik@server:0 \
  -p 80:80@loadbalancer \
  -p 443:443@loadbalancer
```

Install ingress-nginx via Helm.

---

## 2️ Start Backend

```bash
cd backend
npm install
node index.js
```

Runs on:

```
http://localhost:4000
```

---

## 3️ Start Dashboard

```bash
cd dashboard
npm install
npm run dev
```

Runs on:

```
http://localhost:5173
```

---

## 4️ Create Store

Click:

```
Create New Store
```

Store URL will be:

```
http://store-<id>.localtest.me
```

---

# Local vs Production

Helm supports environment-specific configuration:

* `values-local.yaml`
* `values-prod.yaml`

Production differences may include:

* StorageClass
* Ingress domain
* TLS
* Resource limits

---

# Concurrency Handling

* Max 2 parallel store installs
* Additional requests queued
* Prevents cluster overload

---

# 🧠 Design Decisions

### Why Helm?

Declarative, idempotent, Kubernetes-native provisioning.

### Why Namespace-per-store?

Strong isolation boundary for multi-tenancy.

### Why Bootstrap Job?

Ensures WooCommerce setup runs only after infrastructure is ready.

### Why In-Memory Observability?

Simplifies demo; can be persisted to DB in production.

---

# Scalability Considerations

To scale further:

* Horizontal scaling of backend API
* Persistent event storage
* Ingress rate limiting
* Store provisioning worker pool
* Async job queue (Redis / RabbitMQ)

---

# Known Limitations

* Observability events stored in memory
* No authentication layer
* No rate limiting on API
* No production TLS setup in demo

---

# Demo Summary

The demo includes:

1. Create store
2. Watch provisioning events
3. Place order
4. View order in admin
5. Delete store
6. Confirm namespace removed

---

# Round 1 Requirements Covered

* Dashboard-based store creation
* Kubernetes-native provisioning
* Namespace isolation
* Persistent storage
* Ingress routing
* End-to-end order placement
* Clean teardown
* Observability events
* Local-to-prod Helm support

---

# 👨‍💻 Author

Prabhjot Singh
Urumi AI SDE Internship – Round 1 Submission


store-platform/
│
├── dashboard/ (React)
├── backend/
│    ├── api/
│    ├── orchestrator/
│    ├── k8s/
│    ├── helm/
│    └── db/
│
├── charts/
│    └── woocommerce-store/
│
├── values/
│    ├── values-local.yaml
│    └── values-prod.yaml
│
└── README.md


woocommerce-store/
  Chart.yaml
  values.yaml
  templates/
    namespace.yaml
    quota.yaml
    limitrange.yaml
    networkpolicy.yaml
    mysql-deployment.yaml
    mysql-service.yaml
    mysql-pvc.yaml
    wordpress-deployment.yaml
    wordpress-service.yaml
    ingress.yaml

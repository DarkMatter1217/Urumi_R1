const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const crypto = require("crypto");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const stores = {};
let activeInstalls = 0;
const MAX_CONCURRENT_INSTALLS = 2;
const installQueue = [];




function processInstall(storeId, namespace, cmd) {
  activeInstalls++;

  exec(cmd, (error, stdout, stderr) => {
    activeInstalls--;

    if (error) {
      console.error("Helm install failed:", stderr);
      stores[storeId].status = "Failed";
    } else {
      stores[storeId].status = "Ready";
      stores[storeId].readyAt = new Date();
      stores[storeId].provisionTimeSeconds =
        Math.floor(
          (stores[storeId].readyAt - stores[storeId].createdAt) / 1000
        );
    }

    if (installQueue.length > 0 && activeInstalls < MAX_CONCURRENT_INSTALLS) {
      const next = installQueue.shift();
      processInstall(next.storeId, next.namespace, next.cmd);
    }
  });
}


app.post("/stores", (req, res) => {
  const storeId = crypto.randomBytes(4).toString("hex");
  const namespace = `store-${storeId}`;
  const host = `${namespace}.localtest.me`;

  stores[storeId] = {
    id: storeId,
    namespace,
    host,
    status: "Provisioning",
    createdAt: new Date()
  };

  const chartPath = path.resolve(__dirname, "../woocommerce-store");

  const cmd = `helm install ${namespace} "${chartPath}" --namespace ${namespace} --create-namespace --set ingress.host=${host} --wait --timeout 5m`;


  if (activeInstalls >= MAX_CONCURRENT_INSTALLS) {
    installQueue.push({ storeId, namespace, cmd });
  } else {
    processInstall(storeId, namespace, cmd);
  }

  res.json(stores[storeId]);
});

app.get("/stores", (req, res) => {
  res.json(Object.values(stores));
});

app.get("/stores/:id", (req, res) => {
  const store = stores[req.params.id];
  if (!store) return res.status(404).json({ error: "Not found" });
  res.json(store);
});

app.get("/stores/:id/logs", (req, res) => {
  const { id } = req.params;
  const store = stores[id];

  if (!store) {
    return res.status(404).json({ error: "Store not found" });
  }

  exec(
    `kubectl get pods -n ${store.namespace} -l app=wordpress -o jsonpath="{.items[0].metadata.name}"`,
    (err, podName) => {
      if (err || !podName) {
        return res.status(500).json({ error: "WordPress pod not found" });
      }

      exec(
        `kubectl logs ${podName.trim()} -n ${store.namespace} --tail=50`,
        (e, logs) => {
          if (e) {
            return res.status(500).json({ error: "Unable to fetch logs" });
          }
          res.json({ logs });
        }
      );
    }
  );
});


app.delete("/stores/:id", (req, res) => {
  const id = req.params.id;
  const store = stores[id];
  if (!store) return res.status(404).json({ error: "Not found" });

  stores[id].status = "Deleting";

  exec(
    `helm uninstall ${store.namespace} -n ${store.namespace} --wait`,
    (err) => {
      exec(`kubectl delete namespace ${store.namespace}`, () => {
        delete stores[id];
      });
    }
  );


  res.json({ message: "Deletion initiated" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});


function loadExistingStores() {
  exec(`helm list -A -o json`, (err, stdout) => {
    if (err) {
      console.error("Failed to load existing stores:", err);
      return;
    }

    try {
      const releases = JSON.parse(stdout);

      releases.forEach(r => {
        if (r.chart && r.chart.includes("woocommerce-store")) {
          const namespace = r.namespace;
          const storeId = namespace.replace("store-", "");
          const host = `${namespace}.localtest.me`;

          stores[storeId] = {
            id: storeId,
            namespace,
            host,
            status: r.status === "deployed" ? "Ready" : "Unknown",
            createdAt: r.updated
          };
        }
      });

      console.log("Loaded existing stores:", Object.keys(stores));
    } catch (e) {
      console.error("Error parsing helm output:", e);
    }
  });
}


app.listen(4000, () => {
  console.log("Provisioning API running on port 4000");
  loadExistingStores();
});

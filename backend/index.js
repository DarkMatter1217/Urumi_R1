const express = require("express");
const { exec } = require("child_process");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

const stores = {};

app.post("/stores", (req, res) => {
    const storeId = uuidv4().slice(0, 8);
    const namespace = `store-${storeId}`;
    const host = `${namespace}.localtest.me`;

    stores[storeId] = {
        id: storeId,
        namespace,
        host,
        status: "Provisioning",
        createdAt: new Date()
    };

    const cmd = `helm install ${namespace} ../woocommerce-store --namespace ${namespace} --create-namespace --set store.id=${storeId} --set ingress.host=${host}`;

    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            stores[storeId].status = "Failed";
            return;
        }
        stores[storeId].status = "Ready";
    });

    res.json(stores[storeId]);
});

app.get("/stores", (req, res) => {
    res.json(Object.values(stores));
});

app.delete("/stores/:id", (req, res) => {
    const id = req.params.id;
    const store = stores[id];
    if (!store) return res.status(404).json({ error: "Not found" });

    exec(`helm uninstall ${store.namespace} -n ${store.namespace}`, () => {
        exec(`kubectl delete namespace ${store.namespace}`, () => {
            delete stores[id];
        });
    });

    res.json({ message: "Deletion initiated" });
});

app.listen(4000, () => {
    console.log("Provisioning API running on port 4000");
});

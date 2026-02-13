import { useEffect, useState } from "react";

const API = "http://localhost:4000";

function App() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStores = async () => {
    try {
      const res = await fetch(`${API}/stores`);
      const data = await res.json();
      setStores(data);
    } catch (err) {
      console.error("Failed to fetch stores", err);
    }
  };

  const createStore = async () => {
    setLoading(true);
    try {
      await fetch(`${API}/stores`, { method: "POST" });
      await fetchStores();
    } catch (err) {
      console.error("Failed to create store", err);
    }
    setLoading(false);
  };

  const deleteStore = async (id) => {
    try {
      await fetch(`${API}/stores/${id}`, { method: "DELETE" });
      await fetchStores();
    } catch (err) {
      console.error("Failed to delete store", err);
    }
  };

  useEffect(() => {
    fetchStores();
    const interval = setInterval(fetchStores, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h1>Urumi Store Dashboard</h1>

      <button onClick={createStore} disabled={loading}>
        {loading ? "Creating..." : "Create New Store"}
      </button>

      <table border="1" cellPadding="10" style={{ marginTop: 20 }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Status</th>
            <th>URL</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {stores.map((store) => (
            <tr key={store.id}>
              <td>{store.id}</td>
              <td>{store.status}</td>
              <td>
                <a
                  href={`http://${store.host}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open
                </a>
              </td>
              <td>{store.createdAt}</td>
              <td>
                <button onClick={() => deleteStore(store.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;

import { useEffect, useState } from "react";
import api from "./services/api";

function App() {
  const [message, setMessage] = useState("Connecting...");
  const [error, setError] = useState("");

  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await api.get("/connection-test");

        setMessage(response.data.message);
      } catch (error) {
        console.error(error);
        setError("Could not connect to Laravel API.");
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="bg-white p-10 rounded-2xl text-center">
        <h1 className="text-3xl font-bold text-blue-600">Regulars</h1>

        <p className="mt-4 text-gray-600">{message}</p>

        {error && <p className="mt-3 text-red-500">{error}</p>}
      </div>
    </div>
  );
}

export default App;

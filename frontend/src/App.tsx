import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [apiStatus, setApiStatus] = useState<string>("Checking...");
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    // Test backend connection
    fetch("http://localhost:8000/health")
      .then((res) => res.json())
      .then(() => {
        setApiStatus("✅ Connected");
        setIsConnected(true);
      })
      .catch(() => {
        setApiStatus("❌ Not Connected");
        setIsConnected(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col">
      <header className="text-center py-12 px-8 bg-black/20 text-white">
        <h1 className="text-5xl font-bold mb-2">🍳 Recipe Buddy</h1>
        <p className="text-xl opacity-95">Clean slate - Ready to build!</p>
      </header>

      <main className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-2xl w-full">
          <h2 className="text-3xl font-bold text-indigo-600 mb-4">
            Welcome! 🎉
          </h2>
          <p className="text-gray-600 mb-6">
            Your development environment is set up and ready.
          </p>

          <div
            className={`rounded-lg p-6 mb-6 border-l-4 ${
              isConnected === null
                ? "bg-gray-50 border-gray-400"
                : isConnected
                  ? "bg-green-50 border-green-500"
                  : "bg-red-50 border-red-500"
            }`}
          >
            <h3
              className={`text-xl font-semibold mb-2 ${
                isConnected === null
                  ? "text-gray-700"
                  : isConnected
                    ? "text-green-700"
                    : "text-red-700"
              }`}
            >
              Backend API Status
            </h3>
            <p
              className={`text-lg ${
                isConnected === null
                  ? "text-gray-600"
                  : isConnected
                    ? "text-green-600"
                    : "text-red-600"
              }`}
            >
              {apiStatus}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Tech Stack
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li>⚛️ React + TypeScript + Vite</li>
              <li>🎨 Tailwind CSS</li>
              <li>🐍 Python + FastAPI</li>
              <li>🗄️ Neon Postgres</li>
            </ul>
          </div>

          <div className="bg-indigo-50 rounded-lg p-6 border-l-4 border-indigo-500">
            <h3 className="text-xl font-semibold text-indigo-900 mb-2">
              Start Building 🛠️
            </h3>
            <p className="text-indigo-800">
              Everything is ready. Build your app!
            </p>
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-white bg-black/20">
        <p>Built with Neon • FastAPI • React • Tailwind</p>
      </footer>
    </div>
  );
}

export default App;

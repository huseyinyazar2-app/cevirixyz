"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Key } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (token !== "test123") {
      alert("Hatalı token! Oda açma yetkiniz yok.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/room", { method: "POST" });
      const data = await res.json();
      if (data.roomId) {
        router.push(`/room/${data.roomId}`);
      }
    } catch (error) {
      console.error("Failed to create room", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div className="glass-panel" style={{ padding: "40px", maxWidth: "400px", width: "100%", textAlign: "center" }}>
        <div style={{ background: "rgba(59, 130, 246, 0.2)", width: "80px", height: "80px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px auto" }}>
          <Mic size={40} color="#3b82f6" />
        </div>
        
        <h1 style={{ marginBottom: "12px", fontSize: "1.75rem", fontWeight: "bold" }}>AI Çeviri Odası</h1>
        <p style={{ opacity: 0.8, marginBottom: "32px", lineHeight: "1.5" }}>
          Arkadaşlarınızla farklı dillerde, gerçek zamanlı ve kesintisiz sohbet edin.
        </p>
        
        <form onSubmit={createRoom} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ position: "relative" }}>
            <Key size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", opacity: 0.5 }} />
            <input 
              type="password" 
              placeholder="Oda Açma Şifresi (Token)" 
              className="input-field" 
              style={{ paddingLeft: "44px" }}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="btn"
            style={{ width: "100%", padding: "16px", fontSize: "1.1rem" }}
          >
            {loading ? "Oda Kuruluyor..." : "Yeni Oda Kur"}
          </button>
        </form>
      </div>
    </main>
  );
}

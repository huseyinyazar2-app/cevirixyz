"use client";

import { useState, useEffect, useRef, use } from "react";
import QRCode from "react-qr-code";
import { Mic, Square, Share2, Globe, Copy, X, LogOut, Trash2, Save, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

const LANGUAGES = [
  { code: "tr", name: "Türkçe (TR)" },
  { code: "en", name: "İngilizce (EN)" },
  { code: "de", name: "Almanca (DE)" },
  { code: "fr", name: "Fransızca (FR)" },
  { code: "es", name: "İspanyolca (ES)" },
  { code: "it", name: "İtalyanca (IT)" },
  { code: "nl", name: "Hollandaca (NL)" },
  { code: "ar", name: "Arapça (AR)" },
  { code: "ru", name: "Rusça (RU)" },
  { code: "zh", name: "Çince (ZH)" },
  { code: "ja", name: "Japonca (JA)" },
  { code: "pt", name: "Portekizce (PT)" }
];


export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const roomId = resolvedParams.id;
  
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("tr");
  const [roomUrl, setRoomUrl] = useState("");
  
  const [messages, setMessages] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [sourceLang, setSourceLang] = useState("tr");
  const [targetLang, setTargetLang] = useState("auto");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRoomUrl(window.location.href);
  }, []);

  // Polling for messages
  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/sync?roomId=${roomId}`);
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
          chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      } catch (e) {
        console.error("Poll error", e);
      }
    }, 1500); 
    
    return () => clearInterval(interval);
  }, [userId, roomId]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    try {
      const res = await fetch('/api/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, name, language })
      });
      const data = await res.json();
      if (data.userId) {
        setUserId(data.userId);
        setSourceLang(language);
      } else {
        alert("Odaya girilemedi: " + (data.error || "Bilinmeyen hata"));
      }
    } catch (e) {
      alert("Bağlantı hatası");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('roomId', roomId);
        formData.append('userId', userId!);
        formData.append('sourceLang', sourceLang);
        formData.append('targetLang', targetLang);

        try {
          await fetch('/api/chat/send', {
            method: 'POST',
            body: formData
          });
        } catch (e) {
          console.error("Ses gönderilemedi", e);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      alert("Mikrofon izni alınamadı!");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(roomUrl);
    alert("Bağlantı kopyalandı!");
  };

  const handleLeaveAndDelete = async () => {
    try {
      await fetch('/api/room/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId })
      });
      router.push('/');
    } catch (e) {
      console.error(e);
      alert("Silinirken hata oluştu.");
    }
  };

  const handleLeaveAndSave = () => {
    router.push('/');
  };

  if (!userId) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div className="glass-panel" style={{ padding: "30px", maxWidth: "400px", width: "100%", textAlign: "center" }}>
          <h2 style={{ marginBottom: "20px" }}>Odaya Katıl: {roomId}</h2>
          
          <form onSubmit={handleJoin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <input 
              type="text" 
              placeholder="Adınız" 
              className="input-field" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <select 
              className="input-field"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
            <button type="submit" className="btn" style={{ width: "100%" }}>Sohbete Başla</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main style={{ height: "100vh", display: "flex", flexDirection: "column", padding: "16px", paddingTop: "50px", position: "relative" }}>
      <header className="glass-panel" style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h3 style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <Globe size={18} color="var(--primary-color)"/> Oda: {roomId}
          </h3>
          <p style={{ fontSize: "0.75rem", opacity: 0.7, marginTop: "4px" }}>
            Ben: {name} ({sourceLang.toUpperCase()} → {targetLang === 'auto' ? 'AUTO' : targetLang.toUpperCase()})
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn" style={{ padding: "8px", borderRadius: "50%" }} onClick={() => setShowSettingsModal(true)}>
            <Settings size={18} />
          </button>
          <button className="btn" style={{ padding: "8px", borderRadius: "50%" }} onClick={() => setShowShareModal(true)}>
            <Share2 size={18} />
          </button>
          <button className="btn btn-danger" style={{ padding: "8px", borderRadius: "50%" }} onClick={() => setShowExitModal(true)}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="glass-panel" style={{ flex: 1, padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", marginBottom: "16px" }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", opacity: 0.5, fontSize: "0.85rem", margin: "auto" }}>
            Sohbet geçmişi burada görünecek...<br/><br/>Konuşmaya başlamak için mikrofon tuşuna dokunun.
          </div>
        ) : (
          messages.map((m) => {
            const isMine = m.senderId === userId;
            return (
              <div key={m.id} className={`chat-bubble ${isMine ? 'mine' : 'other'}`}>
                {!isMine && <div style={{ fontSize: "0.7rem", opacity: 0.7, marginBottom: "4px" }}>{m.senderName}</div>}
                {isMine ? (
                  <>
                    <div className="text-translated">{m.originalText}</div>
                    <div className="text-original" style={{ marginTop: "4px", marginBottom: 0 }}>{m.translatedText}</div>
                  </>
                ) : (
                  <>
                    <div className="text-original">{m.originalText}</div>
                    <div className="text-translated">{m.translatedText}</div>
                  </>
                )}
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      <div style={{ display: "flex", justifyContent: "center", paddingBottom: "20px" }}>
        <button 
          className={`btn ${isRecording ? 'is-recording' : ''}`} 
          style={{ width: "70px", height: "70px", borderRadius: "50%", padding: 0 }}
          onClick={toggleRecording}
        >
          {isRecording ? <Square size={28} /> : <Mic size={28} />}
        </button>
      </div>
      <p style={{ textAlign: "center", fontSize: "0.75rem", opacity: 0.5 }}>
        {isRecording ? "Durdurmak için dokunun" : "Konuşmak için dokunun"}
      </p>

      {/* Share Modal */}
      {showShareModal && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
          <div className="glass-panel" style={{ padding: "24px", width: "100%", maxWidth: "350px", textAlign: "center", position: "relative" }}>
            <button 
              onClick={() => setShowShareModal(false)}
              style={{ position: "absolute", top: "12px", right: "12px", background: "transparent", border: "none", color: "white", cursor: "pointer" }}
            >
              <X size={24} />
            </button>
            <h3 style={{ marginBottom: "20px" }}>Odayı Paylaş</h3>
            <div style={{ background: "white", padding: "16px", borderRadius: "12px", display: "inline-block", marginBottom: "20px" }}>
              <QRCode value={roomUrl} size={150} />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input type="text" value={roomUrl} readOnly className="input-field" style={{ flex: 1, fontSize: "0.8rem", padding: "8px" }} />
              <button className="btn" onClick={copyLink} style={{ padding: "8px 12px" }}><Copy size={18} /></button>
            </div>
            <p style={{ fontSize: "0.75rem", opacity: 0.7, marginTop: "16px" }}>Arkadaşınız kamerasından okutabilir veya linke tıklayabilir.</p>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
          <div className="glass-panel" style={{ padding: "24px", width: "100%", maxWidth: "350px", position: "relative" }}>
            <button 
              onClick={() => setShowSettingsModal(false)}
              style={{ position: "absolute", top: "12px", right: "12px", background: "transparent", border: "none", color: "white", cursor: "pointer" }}
            >
              <X size={24} />
            </button>
            <h3 style={{ marginBottom: "20px", textAlign: "center" }}>Çeviri Ayarları</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", opacity: 0.8, marginBottom: "6px" }}>Kaynak Dil (Konuştuğunuz Dil)</label>
                <select 
                  className="input-field"
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", opacity: 0.8, marginBottom: "6px" }}>Hedef Dil (Çevrilecek Dil)</label>
                <select 
                  className="input-field"
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                >
                  <option value="auto">Otomatik Algıla</option>
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <button className="btn" onClick={() => setShowSettingsModal(false)} style={{ width: "100%" }}>
              Kaydet ve Kapat
            </button>
          </div>
        </div>
      )}

      {/* Exit Modal */}
      {showExitModal && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
          <div className="glass-panel" style={{ padding: "24px", width: "100%", maxWidth: "350px", textAlign: "center" }}>
            <h3 style={{ marginBottom: "16px", color: "var(--danger-color)" }}>Odadan Ayrıl</h3>
            <p style={{ fontSize: "0.9rem", opacity: 0.8, marginBottom: "24px" }}>
              Odadan çıkmak üzeresiniz. Konuşma geçmişinin veritabanında kalmasını istiyor musunuz? Aksi halde tüm sohbet kalıcı olarak silinecektir.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button className="btn" onClick={handleLeaveAndSave} style={{ justifyContent: "center" }}>
                <Save size={18} /> Kaydet ve Çık
              </button>
              <button className="btn btn-danger" onClick={handleLeaveAndDelete} style={{ justifyContent: "center" }}>
                <Trash2 size={18} /> Sil ve Çık
              </button>
              <button 
                onClick={() => setShowExitModal(false)}
                style={{ background: "transparent", border: "1px solid var(--glass-border)", color: "white", padding: "12px", borderRadius: "8px", marginTop: "8px", cursor: "pointer" }}
              >
                İptal Et
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

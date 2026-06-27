import { useState } from "react";
import { linkGuestToGoogle, logout } from "../firebase/saveLoad";
import usePlayerStore from "../store/usePlayerStore";

export default function SettingsPage({ onClose }) {
  const { isGuest, uid, resetPlayer } = usePlayerStore();
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGoogleLink() {
    setLoading(true);
    try {
      await linkGuestToGoogle();
      setMsg("✅ Googleアカウントと連携しました！");
    } catch (e) {
      setMsg(`❌ エラー: ${e.message}`);
    }
    setLoading(false);
  }

  async function handleLogout() {
    if (!window.confirm("ログアウトしますか？")) return;
    await logout();
    window.location.reload();
  }

  function handleReset() {
    if (!window.confirm("データを全てリセットしますか？")) return;
    resetPlayer();
    setMsg("✅ データをリセットしました");
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, fontFamily:"monospace" }}>
      <div style={{ background:"#0d0d15", border:"1px solid #2a2a3a", borderRadius:10, padding:"24px 24px", width:"100%", maxWidth:320 }}>
        <div style={{ display:"flex", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontSize:14, fontWeight:900, color:"#a78bfa", letterSpacing:3, flex:1 }}>SETTINGS</div>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:"#666", fontSize:18, cursor:"pointer" }}>×</button>
        </div>

        {/* アカウント情報 */}
        <div style={{ background:"#080810", border:"1px solid #1a1a2a", borderRadius:6, padding:12, marginBottom:14 }}>
          <div style={{ fontSize:8, color:"#4a4a6a", letterSpacing:2, marginBottom:6 }}>ACCOUNT</div>
          <div style={{ fontSize:10, color: isGuest ? "#fbbf24" : "#4ade80", marginBottom:4 }}>
            {isGuest ? "👤 ゲストプレイ中" : "✅ Googleアカウント連携済み"}
          </div>
          <div style={{ fontSize:8, color:"#3a3a5a" }}>UID: {uid?.slice(0, 12)}...</div>
        </div>

        {msg && (
          <div style={{ fontSize:10, color:"#4ade80", marginBottom:12, padding:"8px 12px", background:"#0a1a0a", border:"1px solid #4ade8044", borderRadius:4 }}>
            {msg}
          </div>
        )}

        {/* Googleと連携 */}
        {isGuest && (
          <button onClick={handleGoogleLink} disabled={loading} style={{ width:"100%", padding:"12px 0", background:"#0a0a1a", border:"1px solid #60a5fa", borderRadius:6, cursor: loading ? "default" : "pointer", color:"#60a5fa", fontSize:11, fontFamily:"monospace", letterSpacing:2, marginBottom:10 }}>
            {loading ? "連携中…" : "🔗 Googleアカウントと連携"}
          </button>
        )}

        {/* ログアウト */}
        <button onClick={handleLogout} style={{ width:"100%", padding:"10px 0", background:"transparent", border:"1px solid #333", borderRadius:6, cursor:"pointer", color:"#666", fontSize:10, fontFamily:"monospace", marginBottom:10 }}>
          ログアウト
        </button>

        {/* データリセット */}
        <button onClick={handleReset} style={{ width:"100%", padding:"10px 0", background:"transparent", border:"1px solid #f8717133", borderRadius:6, cursor:"pointer", color:"#f87171", fontSize:10, fontFamily:"monospace", opacity:0.6 }}>
          データリセット
        </button>
      </div>
    </div>
  );
}
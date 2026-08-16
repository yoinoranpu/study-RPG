import { useState } from "react";
import { linkGuestToGoogle, logout } from "../firebase/saveLoad";
import { submitFeedback } from "../firebase/feedback";
import usePlayerStore from "../store/usePlayerStore";

export default function SettingsPage({ onClose }) {
  const { isGuest, uid, resetPlayer } = usePlayerStore();
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);

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

  async function handleFeedbackSubmit() {
    const text = feedbackText.trim();
    if (!text) return;
    setFeedbackLoading(true);
    setFeedbackMsg("");
    try {
      await submitFeedback(uid, text);
      setFeedbackText("");
      setFeedbackMsg("✅ 送信しました、ありがとうございます！");
    } catch (e) {
      setFeedbackMsg(`❌ 送信に失敗しました: ${e.message}`);
    }
    setFeedbackLoading(false);
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
          <div style={{ fontSize:9, color:"#7a7a9a", letterSpacing:2, marginBottom:6 }}>ACCOUNT</div>
          <div style={{ fontSize:10, color: isGuest ? "#fbbf24" : "#4ade80", marginBottom:4 }}>
            {isGuest ? "👤 ゲストプレイ中" : "✅ Googleアカウント連携済み"}
          </div>
          <div style={{ fontSize:9, color:"#5c5c82" }}>UID: {uid?.slice(0, 12)}...</div>
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
        <button onClick={handleReset} style={{ width:"100%", padding:"10px 0", background:"transparent", border:"1px solid #f8717133", borderRadius:6, cursor:"pointer", color:"#f87171", fontSize:10, fontFamily:"monospace", opacity:0.6, marginBottom:14 }}>
          データリセット
        </button>

        {/* 意見箱 */}
        <div style={{ background:"#080810", border:"1px solid #1a1a2a", borderRadius:6, padding:12 }}>
          <div style={{ fontSize:9, color:"#7a7a9a", letterSpacing:2, marginBottom:8 }}>ご意見・ご要望</div>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="バグ報告、要望、感想など何でもどうぞ"
            rows={3}
            style={{ width:"100%", boxSizing:"border-box", background:"#0d0d15", border:"1px solid #2a2a3a", borderRadius:4, color:"#ddd", fontSize:11, fontFamily:"monospace", padding:8, resize:"vertical", marginBottom:8 }}
          />
          {feedbackMsg && (
            <div style={{ fontSize:9, color: feedbackMsg.startsWith("✅") ? "#4ade80" : "#f87171", marginBottom:8 }}>
              {feedbackMsg}
            </div>
          )}
          <button
            onClick={handleFeedbackSubmit}
            disabled={feedbackLoading || !feedbackText.trim()}
            style={{ width:"100%", padding:"10px 0", background:"#0a0a1a", border:"1px solid #a78bfa", borderRadius:6, cursor: feedbackLoading || !feedbackText.trim() ? "default" : "pointer", color:"#a78bfa", fontSize:10, fontFamily:"monospace", letterSpacing:1, opacity: feedbackLoading || !feedbackText.trim() ? 0.5 : 1 }}
          >
            {feedbackLoading ? "送信中…" : "送信する"}
          </button>
        </div>
      </div>
    </div>
  );
}
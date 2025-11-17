import React, { useState } from "react";
import api from "../api";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      onLogin(res.data.user, res.data.token);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.error || "로그인 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="stars-layer" />
      <div className="card login-card">
        <div className="login-icon">
          <div className="login-icon-inner">📔</div>
        </div>

        <h1 className="login-title">비밀일기장</h1>
        <p className="login-subtitle">당신만의 특별한 이야기를 간직하는 곳</p>
        <p className="login-subtitle">
          <span>오직 선택된 이들만 들어올 수 있습니다 ✨</span>
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="label" htmlFor="email">
            마법의 주소 (이메일)
          </label>
          <input
            id="email"
            className="input"
            type="email"
            placeholder="test@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="label" htmlFor="password">
            비밀 열쇠
          </label>
          <input
            id="password"
            className="input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <div className="login-error">{error}</div>}

          <div className="login-actions">
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "일기장을 여는 중..." : "일기장 열기"}
            </button>
          </div>

          <div className="divider">또는</div>

          <button
            type="button"
            className="btn-secondary full"
            onClick={() =>
              alert("회원가입은 나중에 붙여도 되고, 지금은 Postman으로 계정 만들어서 쓰면 돼!")
            }
          >
            새로운 일기장 만들기
          </button>

          <p className="invite-text">
            초대장이 있으신가요? <u>초대 코드 입력</u>
          </p>
        </form>

        <p className="footer-text">* 모든 비밀은 안전하게 보호됩니다 *</p>
      </div>
    </div>
  );
}

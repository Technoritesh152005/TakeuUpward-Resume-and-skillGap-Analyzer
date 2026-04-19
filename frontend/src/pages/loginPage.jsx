import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../services/authStore.js";
import GoogleSignInButton from "../components/common components/googleSignInButton.jsx";
import brandLogo from "../assets/Gemini_Generated_Image_hi4jb6hi4jb6hi4j.png";

/* ─── Aurora background ────────────────────────────────────────────────────
   Four colored orbs that slowly drift & scale independently, blending
   together into a living, breathing aurora effect.
─────────────────────────────────────────────────────────────────────────── */
const AuroraBackground = () => (
  <div
    className="fixed inset-0 overflow-hidden pointer-events-none"
    aria-hidden
    style={{ zIndex: 0 }}
  >
    {/* base deep dark */}
    <div className="absolute inset-0" style={{ background: "#080d1a" }} />

    {/* orb 1 – violet (primary brand) */}
    <div
      className="absolute rounded-full"
      style={{
        width: "780px",
        height: "780px",
        top: "-260px",
        left: "-220px",
        background:
          "radial-gradient(circle at center, rgba(124,58,237,0.55), transparent 68%)",
        filter: "blur(72px)",
        animation: "aurora1 14s ease-in-out infinite",
      }}
    />

    {/* orb 2 – fuchsia/energy (excitement) */}
    <div
      className="absolute rounded-full"
      style={{
        width: "640px",
        height: "640px",
        top: "-100px",
        right: "-180px",
        background:
          "radial-gradient(circle at center, rgba(217,70,239,0.40), transparent 65%)",
        filter: "blur(80px)",
        animation: "aurora2 18s ease-in-out infinite",
      }}
    />

    {/* orb 3 – cyan/fresh (innovation, tech) */}
    <div
      className="absolute rounded-full"
      style={{
        width: "560px",
        height: "560px",
        bottom: "-140px",
        right: "-100px",
        background:
          "radial-gradient(circle at center, rgba(6,182,212,0.35), transparent 65%)",
        filter: "blur(70px)",
        animation: "aurora3 22s ease-in-out infinite",
      }}
    />

    {/* orb 4 – blue accent (trust, depth) */}
    <div
      className="absolute rounded-full"
      style={{
        width: "500px",
        height: "500px",
        bottom: "-80px",
        left: "-120px",
        background:
          "radial-gradient(circle at center, rgba(37,99,235,0.38), transparent 65%)",
        filter: "blur(65px)",
        animation: "aurora4 16s ease-in-out infinite",
      }}
    />

    {/* center blending orb (softens the mix) */}
    <div
      className="absolute rounded-full"
      style={{
        width: "400px",
        height: "400px",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background:
          "radial-gradient(circle at center, rgba(139,92,246,0.18), transparent 70%)",
        filter: "blur(50px)",
        animation: "aurora2 20s ease-in-out 3s infinite",
      }}
    />

    {/* subtle dot grid overlay */}
    <div
      className="absolute inset-0 opacity-[0.04]"
      style={{
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
        backgroundSize: "32px 32px",
      }}
    />

    {/* dark overlay so card is readable */}
    <div
      className="absolute inset-0"
      style={{ background: "rgba(8,13,26,0.45)" }}
    />

    <style>{`
      @keyframes aurora1 {
        0%,100% { transform: translate(0%,0%) scale(1); }
        25%      { transform: translate(4%,-6%) scale(1.12); }
        50%      { transform: translate(-3%,4%) scale(0.92); }
        75%      { transform: translate(6%,2%) scale(1.06); }
      }
      @keyframes aurora2 {
        0%,100% { transform: translate(0%,0%) scale(1); }
        30%     { transform: translate(-5%,4%) scale(1.08); }
        60%     { transform: translate(4%,-3%) scale(0.94); }
        80%     { transform: translate(-2%,-5%) scale(1.1); }
      }
      @keyframes aurora3 {
        0%,100% { transform: translate(0%,0%) scale(1); }
        20%     { transform: translate(3%,5%) scale(0.9); }
        55%     { transform: translate(-4%,-3%) scale(1.15); }
        75%     { transform: translate(5%,-2%) scale(0.96); }
      }
      @keyframes aurora4 {
        0%,100% { transform: translate(0%,0%) scale(1); }
        40%     { transform: translate(-3%,-4%) scale(1.1); }
        70%     { transform: translate(4%,3%) scale(0.93); }
      }
      @keyframes fadeSlideUp {
        from { opacity:0; transform:translateY(18px); }
        to   { opacity:1; transform:translateY(0); }
      }
      @keyframes spin {
        to { transform:rotate(360deg); }
      }
    `}</style>
  </div>
);

/* ─── Floating-label input ──────────────────────────────────────────────── */
const FloatingInput = ({
  id,
  name,
  type = "text",
  label,
  value,
  onChange,
  disabled,
  rightAddon,
  error,
}) => {
  const [focused, setFocused] = useState(false);
  const elevated = focused || value.length > 0;

  return (
    <div>
      <div
        style={{
          position: "relative",
          borderRadius: "14px",
          background: "rgba(255,255,255,0.04)",
          border: focused
            ? "1.5px solid rgba(167,139,250,0.75)"
            : error
              ? "1.5px solid rgba(244,63,94,0.60)"
              : "1.5px solid rgba(255,255,255,0.09)",
          boxShadow: focused
            ? "0 0 0 3px rgba(139,92,246,0.15), 0 0 20px rgba(139,92,246,0.10)"
            : "none",
          transition: "border 0.2s, box-shadow 0.2s",
        }}
      >
        <label
          htmlFor={id}
          style={{
            position: "absolute",
            left: "16px",
            pointerEvents: "none",
            transition: "all 0.18s ease",
            top: elevated ? "8px" : "50%",
            transform: elevated ? "none" : "translateY(-50%)",
            fontSize: elevated ? "10px" : "14px",
            fontWeight: elevated ? 600 : 400,
            letterSpacing: elevated ? "0.07em" : "0",
            textTransform: elevated ? "uppercase" : "none",
            color: focused ? "#c4b5fd" : error ? "#fb7185" : "#4b5563",
          }}
        >
          {label}
        </label>
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          autoComplete={type === "password" ? "current-password" : "email"}
          style={{
            display: "block",
            width: "100%",
            boxSizing: "border-box",
            background: "transparent",
            border: "none",
            outline: "none",
            paddingTop: "23px",
            paddingBottom: "9px",
            paddingLeft: "16px",
            paddingRight: rightAddon ? "46px" : "16px",
            fontSize: "14px",
            color: "#e2e8f0",
            caretColor: "#a78bfa",
          }}
        />
        {rightAddon && (
          <div
            style={{
              position: "absolute",
              right: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
            }}
          >
            {rightAddon}
          </div>
        )}
      </div>
      {error && (
        <p
          style={{
            marginTop: "6px",
            fontSize: "12px",
            color: "#fb7185",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            paddingLeft: "2px",
          }}
        >
          <AlertCircle size={11} style={{ flexShrink: 0 }} /> {error}
        </p>
      )}
    </div>
  );
};

/* ─── Page ──────────────────────────────────────────────────────────────── */
const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuthStore();

  useEffect(() => {
    clearError();
  }, [clearError]);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [valErr, setValErr] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (valErr[name]) setValErr((p) => ({ ...p, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      errs.email = "Invalid email format";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 6) errs.password = "Minimum 6 characters";
    setValErr(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    if (!validate()) return;
    try {
      await login({ email: form.email, password: form.password });
      toast.success("Welcome back!", { id: "login-success" });
      const from = location?.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(
        err?.message || err?.error || "Login failed. Please try again.",
      );
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        position: "relative",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <AuroraBackground />

      {/* ── glass card ─────────────────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "420px",
          background: "rgba(10,14,26,0.82)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: "26px",
          padding: "42px 40px 38px",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          boxShadow: `
            0 0 0 1px rgba(167,139,250,0.08),
            0 32px 80px rgba(0,0,0,0.70),
            0 8px 24px rgba(124,58,237,0.12)
          `,
          animation: "fadeSlideUp 0.55s ease-out",
        }}
      >
        {/* logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "11px",
            marginBottom: "34px",
          }}
        >
          <img
            src={brandLogo}
            alt="TakeuUpward logo"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "11px",
              flexShrink: 0,
              objectFit: "cover",
              boxShadow: "0 0 20px rgba(124,58,237,0.25)",
            }}
          />
          <span
            style={{
              fontSize: "20px",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#f1f5f9",
              fontFamily: "Manrope, Inter, sans-serif",
            }}
          >
            Takeu<span style={{ color: "#a78bfa" }}>Upward</span>
          </span>
        </div>

        {/* heading */}
        <div style={{ marginBottom: "28px" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "27px",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.15,
              color: "#f8fafc",
              fontFamily: "Manrope, Inter, sans-serif",
            }}
          >
            Welcome back
          </h1>
          <p
            style={{
              margin: "7px 0 0",
              fontSize: "14px",
              color: "#475569",
              lineHeight: 1.5,
            }}
          >
            Sign in to continue your career journey
          </p>
        </div>

        {/* form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          noValidate
        >
          <FloatingInput
            id="email"
            name="email"
            type="email"
            label="Email Address"
            value={form.email}
            onChange={handleChange}
            disabled={isLoading}
            error={valErr.email}
          />

          <FloatingInput
            id="password"
            name="password"
            type={showPass ? "text" : "password"}
            label="Password"
            value={form.password}
            onChange={handleChange}
            disabled={isLoading}
            error={valErr.password}
            rightAddon={
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                aria-label={showPass ? "Hide password" : "Show password"}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  color: "#4b5563",
                  display: "flex",
                  alignItems: "center",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#a78bfa")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#4b5563")}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
          />

          {/* forgot */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              padding: "2px 0",
            }}
          >
            <Link
              to="/forgot-password"
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#a78bfa",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#c4b5fd")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#a78bfa")}
            >
              Forgot password?
            </Link>
          </div>

          {/* API error */}
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "9px",
                padding: "12px 14px",
                borderRadius: "12px",
                background: "rgba(244,63,94,0.08)",
                border: "1px solid rgba(244,63,94,0.20)",
                color: "#fb7185",
                fontSize: "13px",
                lineHeight: 1.5,
              }}
            >
              <AlertCircle
                size={14}
                style={{ flexShrink: 0, marginTop: "1px" }}
              />{" "}
              {error}
            </div>
          )}

          {/* ── Sign In button ── gradient violet→fuchsia→cyan */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "14px",
              border: "none",
              cursor: isLoading ? "not-allowed" : "pointer",
              background: isLoading
                ? "rgba(124,58,237,0.35)"
                : "linear-gradient(135deg, #7c3aed 0%, #d946ef 55%, #06b6d4 100%)",
              backgroundSize: "200% 200%",
              color: "#fff",
              fontSize: "14.5px",
              fontWeight: 700,
              letterSpacing: "0.01em",
              marginTop: "4px",
              boxShadow: isLoading
                ? "none"
                : "0 0 32px rgba(124,58,237,0.40), 0 4px 16px rgba(0,0,0,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "opacity 0.2s, box-shadow 0.2s, transform 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.opacity = "0.92";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0 0 48px rgba(124,58,237,0.55), 0 8px 24px rgba(0,0,0,0.35)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 0 32px rgba(124,58,237,0.40), 0 4px 16px rgba(0,0,0,0.3)";
            }}
          >
            {isLoading ? (
              <>
                <Loader2
                  size={15}
                  style={{ animation: "spin 0.8s linear infinite" }}
                />{" "}
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>

          {/* divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              margin: "2px 0",
            }}
          >
            <div
              style={{
                flex: 1,
                height: "1px",
                background: "rgba(255,255,255,0.07)",
              }}
            />
            <span
              style={{
                fontSize: "11px",
                color: "#334155",
                fontWeight: 600,
                letterSpacing: "0.06em",
              }}
            >
              OR CONTINUE WITH
            </span>
            <div
              style={{
                flex: 1,
                height: "1px",
                background: "rgba(255,255,255,0.07)",
              }}
            />
          </div>

          {/* Google */}
          <GoogleSignInButton text="Sign in with Google" />

          {/* register */}
          <p
            style={{
              textAlign: "center",
              fontSize: "13px",
              color: "#334155",
              margin: "4px 0 0",
            }}
          >
            New here?{" "}
            <Link
              to="/signup"
              style={{
                color: "#a78bfa",
                fontWeight: 700,
                textDecoration: "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#e879f9")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#a78bfa")}
            >
              Create account
            </Link>
          </p>
        </form>
      </div>

      {/* back to home */}
      <Link
        to="/"
        style={{
          position: "relative",
          zIndex: 1,
          marginTop: "28px",
          fontSize: "13px",
          color: "#1e293b",
          textDecoration: "none",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#64748b")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#1e293b")}
      >
        ← Back to home
      </Link>

      <style>{`
        @keyframes pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.5; transform:scale(1.3); }
        }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeSlideUp {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;

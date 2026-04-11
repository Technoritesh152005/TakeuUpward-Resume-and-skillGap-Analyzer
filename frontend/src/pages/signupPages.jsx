import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import SignupForm from '../components/auth/signupForm.jsx';

const AuroraBackground = () => (
  <div
    className="fixed inset-0 overflow-hidden pointer-events-none"
    aria-hidden
    style={{ zIndex: 0 }}
  >
    <div className="absolute inset-0" style={{ background: '#080d1a' }} />

    <div
      className="absolute rounded-full"
      style={{
        width: '780px',
        height: '780px',
        top: '-260px',
        left: '-220px',
        background:
          'radial-gradient(circle at center, rgba(124,58,237,0.55), transparent 68%)',
        filter: 'blur(72px)',
        animation: 'aurora1 14s ease-in-out infinite',
      }}
    />

    <div
      className="absolute rounded-full"
      style={{
        width: '640px',
        height: '640px',
        top: '-100px',
        right: '-180px',
        background:
          'radial-gradient(circle at center, rgba(217,70,239,0.40), transparent 65%)',
        filter: 'blur(80px)',
        animation: 'aurora2 18s ease-in-out infinite',
      }}
    />

    <div
      className="absolute rounded-full"
      style={{
        width: '560px',
        height: '560px',
        bottom: '-140px',
        right: '-100px',
        background:
          'radial-gradient(circle at center, rgba(6,182,212,0.35), transparent 65%)',
        filter: 'blur(70px)',
        animation: 'aurora3 22s ease-in-out infinite',
      }}
    />

    <div
      className="absolute rounded-full"
      style={{
        width: '500px',
        height: '500px',
        bottom: '-80px',
        left: '-120px',
        background:
          'radial-gradient(circle at center, rgba(37,99,235,0.38), transparent 65%)',
        filter: 'blur(65px)',
        animation: 'aurora4 16s ease-in-out infinite',
      }}
    />

    <div
      className="absolute rounded-full"
      style={{
        width: '400px',
        height: '400px',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background:
          'radial-gradient(circle at center, rgba(139,92,246,0.18), transparent 70%)',
        filter: 'blur(50px)',
        animation: 'aurora2 20s ease-in-out 3s infinite',
      }}
    />

    <div
      className="absolute inset-0 opacity-[0.04]"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    />

    <div
      className="absolute inset-0"
      style={{ background: 'rgba(8,13,26,0.45)' }}
    />

    <style>{`
      @keyframes aurora1 {
        0%,100% { transform: translate(0%,0%) scale(1); }
        25% { transform: translate(4%,-6%) scale(1.12); }
        50% { transform: translate(-3%,4%) scale(0.92); }
        75% { transform: translate(6%,2%) scale(1.06); }
      }
      @keyframes aurora2 {
        0%,100% { transform: translate(0%,0%) scale(1); }
        30% { transform: translate(-5%,4%) scale(1.08); }
        60% { transform: translate(4%,-3%) scale(0.94); }
        80% { transform: translate(-2%,-5%) scale(1.1); }
      }
      @keyframes aurora3 {
        0%,100% { transform: translate(0%,0%) scale(1); }
        20% { transform: translate(3%,5%) scale(0.9); }
        55% { transform: translate(-4%,-3%) scale(1.15); }
        75% { transform: translate(5%,-2%) scale(0.96); }
      }
      @keyframes aurora4 {
        0%,100% { transform: translate(0%,0%) scale(1); }
        40% { transform: translate(-3%,-4%) scale(1.1); }
        70% { transform: translate(4%,3%) scale(0.93); }
      }
      @keyframes fadeSlideUp {
        from { opacity:0; transform:translateY(18px); }
        to { opacity:1; transform:translateY(0); }
      }
    `}</style>
  </div>
);

const SignupPage = () => {
  return (
    <div
      style={{
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px 20px',
        boxSizing: 'border-box',
        position: 'relative',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <AuroraBackground />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '520px',
          background: 'rgba(10,14,26,0.82)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '26px',
          padding: '28px 34px 24px',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          boxShadow: `
            0 0 0 1px rgba(167,139,250,0.08),
            0 32px 80px rgba(0,0,0,0.70),
            0 8px 24px rgba(124,58,237,0.12)
          `,
          animation: 'fadeSlideUp 0.55s ease-out',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '11px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '11px',
              flexShrink: 0,
              background:
                'linear-gradient(135deg, #7c3aed 0%, #d946ef 50%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(124,58,237,0.4)',
            }}
          >
            <FileText size={16} color="#fff" />
          </div>
          <span
            style={{
              fontSize: '20px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#f1f5f9',
              fontFamily: 'Manrope, Inter, sans-serif',
            }}
          >
            Takeu<span style={{ color: '#a78bfa' }}>Upward</span>
          </span>
        </div>

        <div style={{ marginBottom: '18px' }}>
          <h1
            style={{
              margin: 0,
              fontSize: '27px',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.15,
              color: '#f8fafc',
              fontFamily: 'Manrope, Inter, sans-serif',
            }}
          >
            Create your account
          </h1>
          <p
            style={{
              margin: '7px 0 0',
              fontSize: '13px',
              color: '#475569',
              lineHeight: 1.5,
            }}
          >
            Sign up to start your skill-gap analysis and roadmap journey
          </p>
        </div>

        <SignupForm />
      </div>

      <Link
        to="/"
        style={{
          position: 'relative',
          zIndex: 1,
          marginTop: '14px',
          fontSize: '13px',
          color: '#1e293b',
          textDecoration: 'none',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#64748b')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#1e293b')}
      >
        ← Back to home
      </Link>
    </div>
  );
};

export default SignupPage;

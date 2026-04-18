import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import authService from '../services/authService.js';

const ForgotPasswordPage = () => {
 const [loading , setLoading] = useState(false)
 const [email , setEmail] = useState('')
 const [isSubmitted , setIsSubmitted] = useState(false)

 const handleSubmit = async (event)=>{
  event.preventDefault()

  if(!email.trim()){
    toast.error('Email kya tera baap dega?')
    return 
  }

  try{
    setLoading(true)
    await authService.forgotPassword(email.trim())
    setIsSubmitted(true)
    toast.success('If the account exists, a password reset link has been sent to the email.')
  }
  catch(error){
    toast.error(error?.message || 'Failed to sent reset link')
  }
  finally{
    setLoading(false)
  }
 }

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-100">
      <div className="mx-auto flex min-h-[85vh] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur xl:grid-cols-[1.1fr_0.9fr]">
          <section className="hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.28),_transparent_30%),linear-gradient(135deg,_#111827,_#0f172a_55%,_#1d4ed8)] p-10 xl:flex xl:flex-col xl:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                <Send className="h-4 w-4" />
                Password Recovery
              </p>
              <h1 className="mt-6 text-4xl font-black tracking-tight text-white">
                Recover account access without losing your progress.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-7 text-white/75">
                Enter your account email and we will generate a secure reset link so you can set a new password and get back into the dashboard.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm font-semibold text-white">What happens next?</p>
              <ul className="mt-4 space-y-3 text-sm text-white/75">
                <li>We verify whether an account exists for the email.</li>
                <li>A short-lived reset link is generated.</li>
                <li>You open the link and choose a new password.</li>
              </ul>
            </div>
          </section>

          <section className="bg-neutral-950/80 p-6 sm:p-10">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-neutral-400 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>

            <div className="mt-10">
              <h2 className="text-3xl font-bold tracking-tight text-white">Forgot password</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-neutral-400">
                Enter the email linked to your account. If the account exists, we will send a short-lived reset link to that inbox.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-neutral-300">Email address</span>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-primary-500">
                  <Mail className="h-4 w-4 text-neutral-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-neutral-600"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Send className="h-4 w-4" />
                {loading ? 'Generating reset link...' : 'Send reset link'}
              </button>
            </form>

            {isSubmitted ? (
              <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="text-sm font-semibold text-emerald-300">Check your email</p>
                <p className="mt-2 text-sm text-emerald-100">
                  If an account exists for this email, a password reset link has been sent.
                </p>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

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
    toast.error('Please enter your email address.')
    return 
  }

  try{
    setLoading(true)
    await authService.forgotPassword(email.trim())
    setIsSubmitted(true)
    toast.success('If the account exists, a password reset link has been sent to the email.')
  }
  catch(error){
    toast.error(error?.message || 'Failed to send reset link.')
  }
  finally{
    setLoading(false)
  }
 }

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-100">
      <div className="mx-auto flex min-h-[85vh] max-w-2xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur">
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

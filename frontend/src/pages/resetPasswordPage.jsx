import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import authService from '../services/authService.js';

const ResetPasswordPage = () => {
  
  const navigate = useNavigate()
  const [loading , setLoading] = useState(false)
  const [newPassword , setNewPassword] = useState('')
  const [confirmPassword , setConfirmPassword] = useState('')
  const [searchParams] = useSearchParams()
  // get the token from url 
  const token = searchParams.get('token')

  // everytime a token comes new or something just save he token in hasToken
  const hasToken = useMemo(() => Boolean(token), [token]); 

  const handleSubmit = async(event)=>{
    event.preventDefault()
    
    if(!hasToken){
      toast.error('Reset token is missing from the link. chutiya bana raha hai kya hume?')
      return
    }
    if(!newPassword.trim() || newPassword.length <8){
      toast.error('Password not given or length of password is less than 8 characters!..')
      return
    }
    if(newPassword !== confirmPassword){
      toast.error('Both new Password and confirmPassword dont match')
      return
    }

    try{
      setLoading(true)
      const response = await authService.resetPassword({token,newPassword})
      toast.success('You Have successfully changed your password. Please ab side meh aja')
      navigate('/login',{replace:true})
    }catch(error){
      console.error(error)
      toast.error(error?.message||'Something went wrong. maybe failed to reset password ')
    }finally{
      setLoading(false)
    }
  }
  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-100">
      <div className="mx-auto flex min-h-[85vh] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur xl:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.26),_transparent_30%),linear-gradient(135deg,_#111827,_#0f172a_50%,_#065f46)] p-10 xl:flex xl:flex-col xl:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                <ShieldCheck className="h-4 w-4" />
                Secure Reset
              </p>
              <h1 className="mt-6 text-4xl font-black tracking-tight text-white">
                Set a new password and revoke old sessions safely.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-7 text-white/75">
                Once the password is reset, old refresh tokens are revoked so previous sessions can no longer be used.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/75">
              <p className="font-semibold text-white">Security note</p>
              <p className="mt-3">
                This reset link is short-lived and one-time use. If it expires, start the forgot-password flow again.
              </p>
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
              <h2 className="text-3xl font-bold tracking-tight text-white">Reset password</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-neutral-400">
                Choose a new password for your account. After resetting, sign in again with the new credentials.
              </p>
            </div>

            {!hasToken ? (
              <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                Reset token is missing. Open the reset link from your email again.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-neutral-300">New password</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-primary-500">
                    <Lock className="h-4 w-4 text-neutral-500" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="Enter a new password"
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-neutral-600"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-neutral-300">Confirm password</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-primary-500">
                    <KeyRound className="h-4 w-4 text-neutral-500" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Re-enter the new password"
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-neutral-600"
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {loading ? 'Resetting password...' : 'Reset password'}
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

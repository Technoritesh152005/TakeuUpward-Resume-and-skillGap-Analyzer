import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  Camera,
  CheckCircle2,
  Loader2,
  MapPin,
  Save,
  Sparkles,
  UserRound,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import authService from '../services/authService.js';
import useAuthStore from '../services/authStore.js';

// empty form object value
const budgetOptions = [
  { value: 'free', label: 'Free' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const learningStyleOptions = [
  { value: 'mixed', label: 'Mixed' },
  { value: 'visual', label: 'Visual' },
  { value: 'auditory', label: 'Auditory' },
  { value: 'reading', label: 'Reading' },
  { value: 'kinesthetic', label: 'Hands-on' },
];

const experienceLevelOptions = [
  { value: 'student', label: 'Student' },
  { value: 'fresher', label: 'Fresher' },
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
];

const jobTypeOptions = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'internship', label: 'Internship' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'part-time', label: 'Part-time' },
];

const remotePreferenceOptions = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'Onsite' },
  { value: 'flexible', label: 'Flexible' },
];

const createEmptyForm = () => ({
  name: '',
  email: '',
  phone: '',
  location: '',
  bio: '',
  profilePicture: '',
  preferences: {
    hoursPerWeek: '',
    budget: '',
    learningStyle: '',
  },
  careerPreferences: {
    targetRole: '',
    experienceLevel: '',
    preferredJobType: '',
    preferredLocation: '',
    remotePreference: '',
    industryInterestText: '',
  },
});

// mapping data to the empty form
const mapProfileToForm = (profile) => ({
  name: profile?.name || '',
  email: profile?.email || '',
  phone: profile?.phone || '',
  location: profile?.location || '',
  bio: profile?.bio || '',
  profilePicture: profile?.profilePicture || profile?.avatar || '',
  preferences: {
    hoursPerWeek: profile?.preferences?.hoursPerWeek ?? '',
    budget: profile?.preferences?.budget || '',
    learningStyle: profile?.preferences?.learningStyle || '',
  },
  careerPreferences: {
    targetRole: profile?.careerPreferences?.targetRole || '',
    experienceLevel: profile?.careerPreferences?.experienceLevel || '',
    preferredJobType: profile?.careerPreferences?.preferredJobType || '',
    preferredLocation: profile?.careerPreferences?.preferredLocation || '',
    remotePreference: profile?.careerPreferences?.remotePreference || '',
    industryInterestText: Array.isArray(profile?.careerPreferences?.industryInterest)
      ? profile.careerPreferences.industryInterest.join(', ')
      : '',
  },
});

const buildPayload = (form) => {
  const hoursPerWeekValue = String(form.preferences.hoursPerWeek).trim();
  const industries = String(form.careerPreferences.industryInterestText || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const payload = {
    name: form.name.trim() || undefined,
    phone: form.phone.trim() || undefined,
    location: form.location.trim() || undefined,
    bio: form.bio.trim() || undefined,
    profilePicture: form.profilePicture.trim() || undefined,
    preferences: {
      hoursPerWeek: hoursPerWeekValue ? Number(hoursPerWeekValue) : undefined,
      budget: form.preferences.budget || undefined,
      learningStyle: form.preferences.learningStyle || undefined,
    },
    careerPreferences: {
      targetRole: form.careerPreferences.targetRole.trim() || undefined,
      experienceLevel: form.careerPreferences.experienceLevel || undefined,
      preferredJobType: form.careerPreferences.preferredJobType || undefined,
      preferredLocation: form.careerPreferences.preferredLocation.trim() || undefined,
      remotePreference: form.careerPreferences.remotePreference || undefined,
      industryInterest: industries,
    },
  };

  if (
    payload.preferences.hoursPerWeek === undefined &&
    !payload.preferences.budget &&
    !payload.preferences.learningStyle
  ) {
    delete payload.preferences;
  }

  if (
    !payload.careerPreferences.targetRole &&
    !payload.careerPreferences.experienceLevel &&
    !payload.careerPreferences.preferredJobType &&
    !payload.careerPreferences.preferredLocation &&
    !payload.careerPreferences.remotePreference &&
    payload.careerPreferences.industryInterest.length === 0
  ) {
    delete payload.careerPreferences;
  }

  return payload;
};

const ProfilePage = () => {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);
  const authUser = useAuthStore((state) => state.user);

  const [form, setForm] = useState(createEmptyForm);
  const [avatarPreviewFailed, setAvatarPreviewFailed] = useState(false);

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await authService.getProfile();
      return response?.data?.data ?? null;
    },
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    setForm(mapProfileToForm(profileQuery.data));
    setAvatarPreviewFailed(false);
  }, [profileQuery.data]);

  const profile = profileQuery.data;
  const avatarUrl = form.profilePicture.trim();
  const displayName = form.name.trim() || authUser?.name || 'User';
  const initials = useMemo(
    () =>
      displayName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((item) => item.charAt(0).toUpperCase())
        .join('') || 'U',
    [displayName]
  );

  const saveProfileMutation = useMutation({
    mutationFn: async (nextForm) => {
      const response = await authService.updateProfile(buildPayload(nextForm));
      return response?.data?.data ?? null;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['profile'], updatedProfile);
      updateUser(updatedProfile);
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      const message = error?.message || error?.error || 'Failed to update profile';
      toast.error(message);
    },
  });

  const handleTopLevelChange = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleNestedChange = (section, field) => (event) => {
    const value = event.target.value;
    setForm((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    saveProfileMutation.mutate(form);
  };

  if (profileQuery.isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm font-medium text-neutral-700 shadow-soft dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading profile workspace...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (profileQuery.isError) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[65vh] items-center justify-center">
          <div className="max-w-lg rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-soft dark:border-neutral-700 dark:bg-neutral-800">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20">
              <UserRound className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold text-neutral-900 dark:text-white">Profile could not be loaded</h1>
            <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              The profile route is wired, but the data request failed. Retry once the backend is reachable.
            </p>
            <button
              type="button"
              onClick={() => profileQuery.refetch()}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-8">
        <section className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_30%),linear-gradient(135deg,_#0f172a,_#111827_45%,_#0b3b2e)] p-6 text-white shadow-soft dark:border-neutral-700 md:p-8">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                <Sparkles className="h-4 w-4" />
                Profile Workspace
              </p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                Keep your identity, goals, and learning preferences aligned
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-white/80 md:text-base">
                This page now reads and writes to the existing backend profile API, so the product can reuse the same profile context across future flows.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <HeroStat label="Email status" value={profile?.isEmailVerified ? 'Verified' : 'Pending'} />
              <HeroStat label="Auth provider" value={profile?.authProvider || 'local'} />
              <HeroStat label="Updated" value={profile?.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : 'Today'} />
            </div>
          </div>
        </section>

        <form className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.35fr]" onSubmit={handleSubmit}>
          <div className="space-y-6">
            <Panel title="Identity" subtitle="Core profile details plus an optional avatar URL." icon={UserRound}>
              <div className="rounded-3xl bg-neutral-50 p-6 dark:bg-neutral-900/60">
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    {avatarUrl && !avatarPreviewFailed ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        onError={() => setAvatarPreviewFailed(true)}
                        className="h-28 w-28 rounded-[28px] border border-white/20 object-cover shadow-soft"
                      />
                    ) : (
                      <div className="flex h-28 w-28 items-center justify-center rounded-[28px] bg-gradient-to-br from-primary-600 to-emerald-500 text-3xl font-black text-white shadow-soft">
                        {initials}
                      </div>
                    )}
                    <div className="absolute -bottom-2 -right-2 rounded-2xl bg-white p-2 shadow-soft dark:bg-neutral-800">
                      <Camera className="h-4 w-4 text-neutral-600 dark:text-neutral-200" />
                    </div>
                  </div>

                  <h2 className="mt-5 text-2xl font-semibold text-neutral-900 dark:text-white">{displayName}</h2>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{form.email || authUser?.email || 'No email available'}</p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Avatar URL is optional
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <Field label="Full name">
                  <input
                    type="text"
                    value={form.name}
                    onChange={handleTopLevelChange('name')}
                    placeholder="Your full name"
                    className="input"
                  />
                </Field>

                <Field label="Email">
                  <input
                    type="email"
                    value={form.email}
                    disabled
                    className="input cursor-not-allowed opacity-70"
                  />
                </Field>

                <Field label="Profile image URL">
                  <input
                    type="url"
                    value={form.profilePicture}
                    onChange={(event) => {
                      setAvatarPreviewFailed(false);
                      handleTopLevelChange('profilePicture')(event);
                    }}
                    placeholder="https://example.com/avatar.jpg"
                    className="input"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Phone">
                    <input
                      type="text"
                      value={form.phone}
                      onChange={handleTopLevelChange('phone')}
                      placeholder="10-digit Indian number"
                      className="input"
                    />
                  </Field>

                  <Field label="Location">
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        value={form.location}
                        onChange={handleTopLevelChange('location')}
                        placeholder="City, State"
                        className="input pl-11"
                      />
                    </div>
                  </Field>
                </div>

                <Field label="Bio">
                  <textarea
                    rows="5"
                    value={form.bio}
                    onChange={handleTopLevelChange('bio')}
                    placeholder="Add a short summary about your role focus and strengths."
                    className="input resize-none"
                  />
                </Field>
              </div>
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Learning Preferences" subtitle="These fields map directly to the backend profile schema." icon={Sparkles}>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Hours per week">
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={form.preferences.hoursPerWeek}
                    onChange={handleNestedChange('preferences', 'hoursPerWeek')}
                    placeholder="8"
                    className="input"
                  />
                </Field>

                <Field label="Budget">
                  <select
                    value={form.preferences.budget}
                    onChange={handleNestedChange('preferences', 'budget')}
                    className="input"
                  >
                    <option value="">Select budget</option>
                    {budgetOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Learning style">
                  <select
                    value={form.preferences.learningStyle}
                    onChange={handleNestedChange('preferences', 'learningStyle')}
                    className="input"
                  >
                    <option value="">Select style</option>
                    {learningStyleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </Panel>

            <Panel title="Career Preferences" subtitle="These values can feed later roadmap and analysis workflows." icon={Briefcase}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Target role">
                  <input
                    type="text"
                    value={form.careerPreferences.targetRole}
                    onChange={handleNestedChange('careerPreferences', 'targetRole')}
                    placeholder="Frontend Developer"
                    className="input"
                  />
                </Field>

                <Field label="Experience level">
                  <select
                    value={form.careerPreferences.experienceLevel}
                    onChange={handleNestedChange('careerPreferences', 'experienceLevel')}
                    className="input"
                  >
                    <option value="">Select level</option>
                    {experienceLevelOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Preferred job type">
                  <select
                    value={form.careerPreferences.preferredJobType}
                    onChange={handleNestedChange('careerPreferences', 'preferredJobType')}
                    className="input"
                  >
                    <option value="">Select type</option>
                    {jobTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Remote preference">
                  <select
                    value={form.careerPreferences.remotePreference}
                    onChange={handleNestedChange('careerPreferences', 'remotePreference')}
                    className="input"
                  >
                    <option value="">Select mode</option>
                    {remotePreferenceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Preferred location">
                  <input
                    type="text"
                    value={form.careerPreferences.preferredLocation}
                    onChange={handleNestedChange('careerPreferences', 'preferredLocation')}
                    placeholder="Bengaluru, Remote, Pune..."
                    className="input"
                  />
                </Field>

                <Field label="Industry interests">
                  <input
                    type="text"
                    value={form.careerPreferences.industryInterestText}
                    onChange={handleNestedChange('careerPreferences', 'industryInterestText')}
                    placeholder="Fintech, SaaS, AI"
                    className="input"
                  />
                </Field>
              </div>
            </Panel>

            <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-soft dark:border-neutral-700 dark:bg-neutral-800">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">Save profile changes</p>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    Optional fields are omitted when blank so invalid empty enum values are not sent to the backend.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={saveProfileMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saveProfileMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saveProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

const Panel = ({ title, subtitle, icon: Icon, children }) => (
  <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-soft dark:border-neutral-700 dark:bg-neutral-800">
    <div className="mb-6 flex items-start gap-3">
      <div className="rounded-2xl bg-primary-50 p-3 dark:bg-primary-900/20">
        <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-neutral-500 dark:text-neutral-400">{subtitle}</p>
      </div>
    </div>
    <div className="space-y-5">{children}</div>
  </section>
);

const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-neutral-700 dark:text-neutral-200">{label}</span>
    {children}
  </label>
);

const HeroStat = ({ label, value }) => (
  <div className="rounded-2xl bg-white/10 px-4 py-4 backdrop-blur-sm">
    <p className="text-xs uppercase tracking-wide text-white/70">{label}</p>
    <p className="mt-2 text-lg font-bold capitalize text-white">{value}</p>
  </div>
);

export default ProfilePage;

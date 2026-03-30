import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, FileText, User, Mail, Phone, MapPin, 
  Briefcase, GraduationCap, Code, Award, Linkedin, 
  Github, Globe, Calendar, Trash2, RefreshCw, Target,
  ChevronDown, ChevronUp
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import resumeService from '../services/resumeService.js'
import toast from 'react-hot-toast';
import { formatDistanceToNow, format } from 'date-fns';

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const hasItems = (value) => Array.isArray(value) && value.length > 0;
const hasObjectValues = (value) =>
  !!value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.values(value).some((entry) => {
    if (hasText(entry)) return true;
    if (hasItems(entry)) return true;
    return !!entry && typeof entry === 'object' && Object.keys(entry).length > 0;
  });

const ResumeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reparsing, setReparsing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    summary: true,
    experience: true,
    education: true,
    skills: true,
    projects: false,
    certifications: false,
  });
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    fetchResume();
  }, [id]);

  const fetchResume = async () => {
    if (!id) {
      setLoadError('missing_id');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setLoadError(null);
      const payload = await resumeService.getResumeById(id);
      const doc = payload?.data ?? null;
      if (!doc || typeof doc !== 'object') {
        throw new Error('Invalid resume payload');
      }
      setResume(doc);
    } catch (error) {
      console.error('Failed to fetch resume:', error);
      setResume(null);
      setLoadError('fetch_failed');
      toast.error('Failed to load resume');
    } finally {
      setLoading(false);
    }
  };

  const handleReparse = async () => {
    try {
      setReparsing(true);
      await resumeService.reparseResume(id);
      toast.success('Resume reparsed successfully!');
      fetchResume();
    } catch (error) {
      console.error('Failed to reparse:', error);
      toast.error('Failed to reparse resume');
    } finally {
      setReparsing(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this resume?')) {
      try {
        const data = await resumeService.deleteResume(id);
        if(data.data.success === true){
          toast.success('Resume deleted successfully');
        navigate('/resumes');
        }
        
      } catch (error) {
        console.error('Failed to delete:', error);
        toast.error('Failed to delete resume');
      }
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="h-8 w-32 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 border border-neutral-200 dark:border-neutral-700">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!resume) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto mt-16 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-8 text-center space-y-4">
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
            {loadError === 'missing_id' ? 'Invalid link' : 'Could not load resume'}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {loadError === 'missing_id'
              ? 'This page needs a valid resume id in the URL.'
              : 'The resume may have been removed, or you may need to sign in again.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/resumes')}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
          >
            Back to My Resumes
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const parsedData = resume.parsedData || {};
  const personalLinkedin = parsedData.personal?.linkedin || parsedData.personal?.Linkedin;
  const personalGithub = parsedData.personal?.github || parsedData.personal?.Github;
  const personalPortfolio = parsedData.personal?.portfolio || parsedData.personal?.personalPortfolio;
  const educationItems = parsedData.education || parsedData.eduaction || [];
  const projectItems = parsedData.project || parsedData.projects || [];
  const certificationData = parsedData.certification || parsedData.certifications || {};
  const achievementItems = parsedData.achievments || parsedData.achievements || [];
  const skillGroups = [
    parsedData.skills?.technical || [],
    parsedData.skills?.frameworks || [],
    parsedData.skills?.tools || [],
    parsedData.skills?.language || parsedData.skills?.languages || [],
    parsedData.skills?.database || parsedData.skills?.databases || [],
  ];

  const hasPersonalInfo =
    hasObjectValues(parsedData.personal) ||
    hasText(personalLinkedin) ||
    hasText(personalGithub) ||
    hasText(personalPortfolio);
  const hasSummary = hasText(parsedData.summary);
  const hasExperience = hasItems(parsedData.experience);
  const hasEducation = hasItems(educationItems);
  const hasSkills = skillGroups.some((group) => hasItems(group));
  const hasProjects = hasItems(projectItems);
  const hasCertifications = hasObjectValues(certificationData);
  const hasAchievements = hasItems(achievementItems);
  const hasParsedContent =
    hasPersonalInfo ||
    hasSummary ||
    hasExperience ||
    hasEducation ||
    hasSkills ||
    hasProjects ||
    hasCertifications ||
    hasAchievements;

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <button
            onClick={() => navigate('/resumes')}
            className="group flex items-center gap-2 text-neutral-500 hover:text-white transition-all font-bold uppercase tracking-widest text-xs"
          >
            <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Back to Resumes
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReparse}
              disabled={reparsing}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600/10 text-blue-400 border border-blue-600/20 rounded-xl hover:bg-blue-600/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${reparsing ? 'animate-spin' : ''}`} />
              <span className="text-xs font-black uppercase tracking-widest">Reparse</span>
            </button>

            <button
              onClick={() => navigate(`/analysis/create?resumeId=${id}`)}
              className="btn-gradient px-6 py-2.5"
            >
              <Target className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">Analyze Gaps</span>
            </button>

            <button
              onClick={handleDelete}
              className="p-2.5 bg-danger-500/10 text-danger-400 border border-danger-500/20 rounded-xl hover:bg-danger-500/20 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Resume Info Card */}
        <div className="card-glass p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full -mr-32 -mt-32 blur-[100px]" />
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-600 rounded-3xl flex items-center justify-center shadow-glow-sm">
                <FileText className="w-10 h-10 text-white drop-shadow-lg" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight mb-2">
                  {resume.originalFileName}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-neutral-400">
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                    <Calendar className="w-3.5 h-3.5 text-primary-400" />
                    Uploaded {resume.createdAt ? formatDistanceToNow(new Date(resume.createdAt), { addSuffix: true }) : 'recently'}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                    <FileText className="w-3.5 h-3.5 text-accent-400" />
                    {resume.pageCount || parsedData.pageCount || 0} Pages
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-8">
               <div className="text-center">
                  <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-1">File Size</p>
                  <p className="text-xl font-bold text-white">{(resume.fileSize / 1024 / 1024).toFixed(2)} MB</p>
               </div>
               <div className="h-10 w-px bg-white/10 hidden sm:block" />
               <div className="text-right">
                  <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-1">Status</p>
                  <div className={`badge ${
                    resume.processingStatus === 'completed'
                      ? 'badge-success'
                      : 'badge-warning'
                  } py-1.5 px-4 text-xs`}>
                    {resume.processingStatus || 'Processing'}
                  </div>
               </div>
            </div>
          </div>
        </div>

        {!hasParsedContent && (
          <div className="p-6 bg-warning-500/10 border border-warning-500/20 rounded-2xl animate-pulse">
            <h2 className="text-lg font-black text-warning-400 tracking-tight uppercase">Low Parsing Quality Detected</h2>
            <p className="mt-2 text-sm text-neutral-400 font-medium leading-relaxed">
              This file has very limited extracted text. If the PDF is scanned or image-based, our AI may struggle to parse sections correctly.
            </p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          
          <div className="flex-1 space-y-8">
            {/* Summary */}
            {hasSummary && (
              <Section
                title="Professional Summary"
                icon={FileText}
                expanded={expandedSections.summary}
                onToggle={() => toggleSection('summary')}
              >
                <p className="text-neutral-300 font-medium leading-relaxed text-lg">
                  {parsedData.summary}
                </p>
              </Section>
            )}

            {/* Experience */}
            {hasExperience && (
              <Section
                title="Work Experience"
                icon={Briefcase}
                count={parsedData.experience.length}
                expanded={expandedSections.experience}
                onToggle={() => toggleSection('experience')}
              >
                <div className="space-y-12 pt-4">
                  {parsedData.experience.map((exp, index) => (
                    <div key={index} className="relative pl-10">
                      {/* Timeline Connector */}
                      {index !== parsedData.experience.length - 1 && (
                        <div className="absolute left-[15px] top-[30px] bottom-[-30px] w-0.5 bg-gradient-to-b from-primary-500/50 to-transparent" />
                      )}
                      {/* Timeline Dot */}
                      <div className="absolute left-0 top-1 w-8 h-8 bg-neutral-950 border-2 border-primary-500 rounded-full flex items-center justify-center shadow-glow-sm z-10">
                        <Briefcase className="w-4 h-4 text-primary-400" />
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="text-xl font-bold text-white group-hover:text-primary-300 transition-colors">
                              {exp.title}
                            </h4>
                            <p className="text-primary-400 font-black tracking-widest text-xs uppercase mt-1">
                              {exp.company}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 text-xs font-bold text-neutral-400 whitespace-nowrap">
                            <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                            {exp.startDate && format(new Date(exp.startDate), 'MMM yyyy')}
                            {' — '}
                            {exp.current ? 'Present' : exp.endDate ? format(new Date(exp.endDate), 'MMM yyyy') : 'N/A'}
                          </div>
                        </div>

                        {exp.location && (
                          <p className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 uppercase tracking-widest">
                            <MapPin className="w-3.5 h-3.5" />
                            {exp.location}
                          </p>
                        )}

                        {exp.description && (
                          <p className="text-neutral-400 font-medium leading-relaxed">
                            {exp.description}
                          </p>
                        )}

                        {exp.responsibilities && exp.responsibilities.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em]">Responsibilities</p>
                            <ul className="grid grid-cols-1 gap-2">
                              {exp.responsibilities.map((resp, i) => (
                                <li key={i} className="text-sm text-neutral-400 font-medium flex items-start gap-3 bg-white/2 hover:bg-white/5 p-2 rounded-lg transition-colors border border-transparent hover:border-white/5">
                                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-500/50 flex-shrink-0" />
                                  <span>{resp}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {exp.skillsUsed && exp.skillsUsed.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {exp.skillsUsed.map((skill, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 bg-white/5 text-neutral-300 border border-white/10 rounded-md text-[10px] font-black uppercase tracking-wider"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Projects */}
            {hasProjects && (
              <Section
                title="Featured Projects"
                icon={Code}
                count={projectItems.length}
                expanded={expandedSections.projects}
                onToggle={() => toggleSection('projects')}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {projectItems.map((project, index) => (
                    <div key={index} className="p-6 bg-white/2 hover:bg-white/5 border border-white/5 rounded-2xl transition-all group/proj">
                      <div className="flex items-center justify-between mb-4">
                         <div className="p-2.5 bg-primary-500/10 rounded-xl border border-primary-500/20 text-primary-400 group-hover/proj:scale-110 transition-transform">
                            <Code className="w-5 h-5" />
                         </div>
                         <div className="flex items-center gap-2">
                            {(project.liveUrl || project.url) && (
                              <a href={project.liveUrl || project.url} target="_blank" rel="noopener noreferrer" className="p-2 text-neutral-500 hover:text-white transition-colors">
                                <Globe className="w-4 h-4" />
                              </a>
                            )}
                            {project.github && (
                              <a href={project.github} target="_blank" rel="noopener noreferrer" className="p-2 text-neutral-500 hover:text-white transition-colors">
                                <Github className="w-4 h-4" />
                              </a>
                            )}
                         </div>
                      </div>
                      <h4 className="text-lg font-bold text-white mb-2">{project.title}</h4>
                      <p className="text-sm text-neutral-400 font-medium leading-relaxed mb-4 line-clamp-3">
                        {project.description}
                      </p>
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {project.technologies.slice(0, 4).map((tech, i) => (
                            <span key={i} className="px-2 py-0.5 bg-accent-500/10 text-accent-400 border border-accent-500/10 rounded text-[10px] font-black tracking-widest uppercase">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>

          <aside className="lg:w-[400px] space-y-8">
            {/* Personal Information */}
            {hasPersonalInfo && (
              <div className="card-glass p-8 border-white/5 space-y-6">
                <h3 className="text-xs font-black text-neutral-500 uppercase tracking-[0.3em] flex items-center gap-2">
                  <User className="w-4 h-4 text-primary-400" />
                  Profile Details
                </h3>
                <div className="space-y-5">
                  {parsedData.personal.name && (
                    <InfoItem icon={User} label="Name" value={parsedData.personal.name} />
                  )}
                  {parsedData.personal.email && (
                    <InfoItem icon={Mail} label="Email" value={parsedData.personal.email} />
                  )}
                  {parsedData.personal.phone && (
                    <InfoItem icon={Phone} label="Phone" value={parsedData.personal.phone} />
                  )}
                  {parsedData.personal.location && (
                    <InfoItem icon={MapPin} label="Location" value={parsedData.personal.location} />
                  )}
                  <div className="pt-4 border-t border-white/5 flex flex-wrap gap-3">
                    {personalLinkedin && (
                      <SocialLink icon={Linkedin} url={personalLinkedin} color="blue" />
                    )}
                    {personalGithub && (
                      <SocialLink icon={Github} url={personalGithub} color="neutral" />
                    )}
                    {personalPortfolio && (
                      <SocialLink icon={Globe} url={personalPortfolio} color="primary" />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Skills */}
            {hasSkills && (
              <div className="card-glass p-8 border-white/5 space-y-8">
                <h3 className="text-xs font-black text-neutral-500 uppercase tracking-[0.3em] flex items-center gap-2">
                  <Code className="w-4 h-4 text-accent-400" />
                  Skill Arsenal
                </h3>
                <div className="space-y-8">
                  {parsedData.skills.technical && parsedData.skills.technical.length > 0 && (
                    <SkillGroup title="Technical" skills={parsedData.skills.technical} color="primary" />
                  )}
                  {parsedData.skills.frameworks && parsedData.skills.frameworks.length > 0 && (
                    <SkillGroup title="Frameworks" skills={parsedData.skills.frameworks} color="accent" />
                  )}
                  {parsedData.skills.tools && parsedData.skills.tools.length > 0 && (
                    <SkillGroup title="Tools" skills={parsedData.skills.tools} color="energy" />
                  )}
                </div>
              </div>
            )}

            {/* Education */}
            {hasEducation && (
              <div className="card-glass p-8 border-white/5 space-y-6">
                <h3 className="text-xs font-black text-neutral-500 uppercase tracking-[0.3em] flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-success-400" />
                  Education
                </h3>
                <div className="space-y-6">
                  {educationItems.map((edu, index) => (
                    <div key={index} className="space-y-2 relative pl-4 border-l border-white/10">
                      <h4 className="text-sm font-bold text-white leading-tight">
                        {edu.degree} {edu.major && <span className="text-neutral-500 font-medium">in {edu.major}</span>}
                      </h4>
                      <p className="text-xs font-black text-primary-400 uppercase tracking-widest">{edu.institution || edu.instituition}</p>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-neutral-500 uppercase">
                         <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {edu.endDate ? format(new Date(edu.endDate), 'yyyy') : 'N/A'}</span>
                         { (edu.gpa || edu.cgpa) && <span>GPA: {edu.gpa || edu.cgpa}</span> }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </DashboardLayout>
);
};

// Reusable Components
const Section = ({ title, icon: Icon, count, children, expanded, onToggle }) => (
  <div className="card-glass overflow-hidden border-white/5">
    <button
      onClick={onToggle}
      className="w-full px-8 py-6 flex items-center justify-between hover:bg-white/2 transition-all group"
    >
      <div className="flex items-center gap-4">
        <div className="p-2.5 bg-primary-500/10 rounded-xl border border-primary-500/20 text-primary-400 group-hover:scale-110 transition-transform">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex items-baseline gap-2">
           <h2 className="text-xl font-black text-white tracking-tight uppercase tracking-widest">
             {title}
           </h2>
           {count && <span className="text-xs font-black text-neutral-600 tracking-[0.2em]">{count} ITEMS</span>}
        </div>
      </div>
      <div className={`p-2 rounded-lg bg-white/5 text-neutral-500 group-hover:text-white transition-all ${expanded ? 'rotate-180' : ''}`}>
        <ChevronUp className="w-4 h-4" />
      </div>
    </button>
    {expanded && (
      <div className="px-8 pb-8 animate-slide-down">
        {children}
      </div>
    )}
  </div>
);

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-4 group/item">
    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 group-hover/item:border-primary-500/30 transition-all">
      <Icon className="w-4 h-4 text-neutral-500 group-hover/item:text-primary-400" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="font-bold text-white truncate text-sm">{value}</p>
    </div>
  </div>
);

const SocialLink = ({ icon: Icon, url, color }) => {
  const colors = {
    blue: 'bg-blue-600/10 text-blue-400 border-blue-600/20',
    neutral: 'bg-neutral-600/10 text-neutral-400 border-neutral-600/20',
    primary: 'bg-primary-600/10 text-primary-400 border-primary-600/20'
  };
  return (
    <a 
      href={url.startsWith('http') ? url : `https://${url}`} 
      target="_blank" 
      rel="noopener noreferrer"
      className={`p-2.5 rounded-xl border ${colors[color]} hover:scale-110 transition-all`}
    >
      <Icon className="w-4 h-4" />
    </a>
  );
};

const SkillGroup = ({ title, skills, color }) => {
  const colors = {
    primary: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
    accent: 'bg-accent-500/10 text-accent-400 border-accent-500/20',
    energy: 'bg-energy-500/10 text-energy-400 border-energy-500/20'
  };

  return (
    <div className="space-y-4">
      <h4 className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em]">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <span
            key={index}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider border transition-all ${colors[color]} hover:scale-105`}
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ResumeDetailPage;

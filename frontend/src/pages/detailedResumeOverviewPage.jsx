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

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/resumes')}
            className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to My Resumes</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReparse}
              disabled={reparsing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${reparsing ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Reparse</span>
            </button>

            <button
              onClick={() => navigate(`/analysis/create?resumeId=${id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Target className="w-4 h-4" />
              <span className="text-sm font-medium">Analyze</span>
            </button>

            <button
              onClick={handleDelete}
              className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Resume Info Card */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{resume.originalFileName}</h1>
                  <p className="text-primary-100 text-sm">
                    Uploaded {resume.createdAt ? formatDistanceToNow(new Date(resume.createdAt), { addSuffix: true }) : 'recently'}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-primary-100 mb-1">File Size</div>
              <div className="text-lg font-semibold">
                {(resume.fileSize / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{parsedData.wordCount || 0} words</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>{parsedData.pageCount || 0} pages</span>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              parsedData.processingStatus === 'completed'
                ? 'bg-green-400/20 text-green-100'
                : 'bg-amber-400/20 text-amber-100'
            }`}>
              {parsedData.processingStatus || 'Processing'}
            </div>
          </div>
        </div>

        {/* Personal Information */}
        {parsedData.personal && (
          <Section
            title="Personal Information"
            icon={User}
            expanded={expandedSections.personal}
            onToggle={() => toggleSection('personal')}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              {parsedData.personal.Linkedin && (
                <InfoItem 
                  icon={Linkedin} 
                  label="LinkedIn" 
                  value={parsedData.personal.Linkedin}
                  link={parsedData.personal.Linkedin}
                />
              )}
              {parsedData.personal.Github && (
                <InfoItem 
                  icon={Github} 
                  label="GitHub" 
                  value={parsedData.personal.Github}
                  link={parsedData.personal.Github}
                />
              )}
              {parsedData.personal.personalPortfolio && (
                <InfoItem 
                  icon={Globe} 
                  label="Portfolio" 
                  value={parsedData.personal.personalPortfolio}
                  link={parsedData.personal.personalPortfolio}
                />
              )}
            </div>
          </Section>
        )}

        {/* Summary */}
        {parsedData.summary && (
          <Section
            title="Professional Summary"
            icon={FileText}
            expanded={expandedSections.summary}
            onToggle={() => toggleSection('summary')}
          >
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
              {parsedData.summary}
            </p>
          </Section>
        )}

        {/* Experience */}
        {parsedData.experience && parsedData.experience.length > 0 && (
          <Section
            title="Work Experience"
            icon={Briefcase}
            count={parsedData.experience.length}
            expanded={expandedSections.experience}
            onToggle={() => toggleSection('experience')}
          >
            <div className="space-y-6">
              {parsedData.experience.map((exp, index) => (
                <div key={index} className="relative pl-6 border-l-2 border-primary-200 dark:border-primary-800">
                  <div className="absolute -left-2 top-0 w-4 h-4 bg-primary-600 rounded-full" />
                  
                  <div className="mb-2">
                    <h4 className="text-lg font-bold text-neutral-900 dark:text-white">
                      {exp.title}
                    </h4>
                    <p className="text-primary-600 dark:text-primary-400 font-medium">
                      {exp.company}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                      {exp.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {exp.location}
                        </span>
                      )}
                      {(exp.startDate || exp.endDate) && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {exp.startDate && format(new Date(exp.startDate), 'MMM yyyy')}
                          {' - '}
                          {exp.current ? 'Present' : exp.endDate ? format(new Date(exp.endDate), 'MMM yyyy') : 'N/A'}
                        </span>
                      )}
                    </div>
                  </div>

                  {exp.description && (
                    <p className="text-neutral-700 dark:text-neutral-300 mb-3">
                      {exp.description}
                    </p>
                  )}

                  {exp.responsibilities && exp.responsibilities.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                        Responsibilities:
                      </p>
                      <ul className="space-y-1">
                        {exp.responsibilities.map((resp, i) => (
                          <li key={i} className="text-sm text-neutral-700 dark:text-neutral-300 flex items-start gap-2">
                            <span className="text-primary-600 mt-1">•</span>
                            <span>{resp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {exp.achievements && exp.achievements.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                        Achievements:
                      </p>
                      <ul className="space-y-1">
                        {exp.achievements.map((achievement, i) => (
                          <li key={i} className="text-sm text-neutral-700 dark:text-neutral-300 flex items-start gap-2">
                            <span className="text-green-600 mt-1">✓</span>
                            <span>{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {exp.skillsUsed && exp.skillsUsed.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {exp.skillsUsed.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-md text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Education */}
        {parsedData.education && parsedData.education.length > 0 && (
          <Section
            title="Education"
            icon={GraduationCap}
            count={parsedData.education.length}
            expanded={expandedSections.education}
            onToggle={() => toggleSection('education')}
          >
            <div className="space-y-4">
              {parsedData.education.map((edu, index) => (
                <div key={index} className="p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl">
                  <h4 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
                    {edu.degree} {edu.major && `in ${edu.major}`}
                  </h4>
                  <p className="text-primary-600 dark:text-primary-400 font-medium mb-2">
                    {edu.instituition}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                    {edu.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {edu.location}
                      </span>
                    )}
                    {(edu.startDate || edu.endDate) && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {edu.startDate && format(new Date(edu.startDate), 'MMM yyyy')}
                        {' - '}
                        {edu.currentStatus ? 'Present' : edu.endDate ? format(new Date(edu.endDate), 'MMM yyyy') : 'N/A'}
                      </span>
                    )}
                    {edu.cgpa && (
                      <span className="font-semibold">GPA: {edu.cgpa}</span>
                    )}
                  </div>
                  {edu.achievments && edu.achievments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {edu.achievments.map((achievement, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md text-xs"
                        >
                          {achievement}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Skills */}
        {parsedData.skills && (
          <Section
            title="Skills"
            icon={Code}
            expanded={expandedSections.skills}
            onToggle={() => toggleSection('skills')}
          >
            <div className="space-y-4">
              {parsedData.skills.technical && parsedData.skills.technical.length > 0 && (
                <SkillGroup title="Technical Skills" skills={parsedData.skills.technical} color="blue" />
              )}
              {parsedData.skills.frameworks && parsedData.skills.frameworks.length > 0 && (
                <SkillGroup title="Frameworks" skills={parsedData.skills.frameworks} color="purple" />
              )}
              {parsedData.skills.tools && parsedData.skills.tools.length > 0 && (
                <SkillGroup title="Tools" skills={parsedData.skills.tools} color="green" />
              )}
              {parsedData.skills.language && parsedData.skills.language.length > 0 && (
                <SkillGroup title="Languages" skills={parsedData.skills.language} color="amber" />
              )}
              {parsedData.skills.database && parsedData.skills.database.length > 0 && (
                <SkillGroup title="Databases" skills={parsedData.skills.database} color="red" />
              )}
            </div>
          </Section>
        )}

        {/* Projects */}
        {parsedData.project && parsedData.project.length > 0 && (
          <Section
            title="Projects"
            icon={Code}
            count={parsedData.project.length}
            expanded={expandedSections.projects}
            onToggle={() => toggleSection('projects')}
          >
            <div className="space-y-4">
              {parsedData.project.map((project, index) => (
                <div key={index} className="p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl">
                  <h4 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                    {project.title}
                  </h4>
                  <p className="text-neutral-700 dark:text-neutral-300 mb-3">
                    {project.description}
                  </p>
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {project.technologies.map((tech, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-md text-xs font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                      >
                        <Globe className="w-3 h-3" />
                        Live Demo
                      </a>
                    )}
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neutral-600 dark:text-neutral-400 hover:underline flex items-center gap-1"
                      >
                        <Github className="w-3 h-3" />
                        Source Code
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Certifications */}
        {parsedData.certification && Object.keys(parsedData.certification).length > 0 && (
          <Section
            title="Certifications"
            icon={Award}
            expanded={expandedSections.certifications}
            onToggle={() => toggleSection('certifications')}
          >
            <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {parsedData.certification.name && (
                  <div>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Name:</span>
                    <p className="font-semibold text-neutral-900 dark:text-white">
                      {parsedData.certification.name}
                    </p>
                  </div>
                )}
                {parsedData.certification.issuer && (
                  <div>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Issuer:</span>
                    <p className="font-semibold text-neutral-900 dark:text-white">
                      {parsedData.certification.issuer}
                    </p>
                  </div>
                )}
                {parsedData.certification.issueDate && (
                  <div>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Issue Date:</span>
                    <p className="font-semibold text-neutral-900 dark:text-white">
                      {format(new Date(parsedData.certification.issueDate), 'MMM yyyy')}
                    </p>
                  </div>
                )}
                {parsedData.certification.url && (
                  <div>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Credential:</span>
                    <a
                      href={parsedData.certification.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-primary-600 dark:text-primary-400 hover:underline block truncate"
                    >
                      View Certificate
                    </a>
                  </div>
                )}
              </div>
            </div>
          </Section>
        )}
      </div>
    </DashboardLayout>
  );
};

// Reusable Components
const Section = ({ title, icon: Icon, count, children, expanded, onToggle }) => (
  <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full px-6 py-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
          {title}
          {count && <span className="ml-2 text-sm text-neutral-500">({count})</span>}
        </h2>
      </div>
      {expanded ? (
        <ChevronUp className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
      ) : (
        <ChevronDown className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
      )}
    </button>
    {expanded && (
      <div className="px-6 pb-6">
        {children}
      </div>
    )}
  </div>
);

const InfoItem = ({ icon: Icon, label, value, link }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{label}</p>
      {link ? (
        <a
          href={link.startsWith('http') ? link : `https://${link}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary-600 dark:text-primary-400 hover:underline truncate block"
        >
          {value}
        </a>
      ) : (
        <p className="font-medium text-neutral-900 dark:text-white truncate">{value}</p>
      )}
    </div>
  </div>
);

const SkillGroup = ({ title, skills, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  };

  return (
    <div>
      <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <span
            key={index}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${colorClasses[color]}`}
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ResumeDetailPage;

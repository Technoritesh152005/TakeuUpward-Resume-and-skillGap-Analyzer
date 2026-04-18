import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, Loader2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import resumeService from '../services/resumeService.js';
import toast from 'react-hot-toast';

const Uploadresume = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingProgress, setUploadingProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedResume, setUploadedResume] = useState(null);
  const [error, setError] = useState(null);

  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ];
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  const validateFile = (file) => {
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a PDF or Word document (.pdf, .doc, .docx)';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Please file size must be less than 5MB';
    }
    return null;
  };

  const handleFileSelect = (file) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }
    setSelectedFile(file);
    setError(null);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const uploadResume = async () => {
    if (!selectedFile) return;
    let progressInterval;
    try {
      setUploading(true);
      setUploadingProgress(0);
      setDragActive(false);

      progressInterval = window.setInterval(() => {
        setUploadingProgress((prev) => {
          if (prev >= 90) {
            window.clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 2000);

      const formData = new FormData();
      formData.append('resume', selectedFile);

      const response = await resumeService.uploadResume(formData);
      setUploadingProgress(100);
      setUploadedResume(response);
      toast.success('Resume successfully uploaded and parsed');

      setTimeout(() => {
        navigate('/resumes');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to upload resume');
      toast.error('Upload failed. Please try again.');
      setUploadingProgress(0);
    } finally {
      if (progressInterval) {
        window.clearInterval(progressInterval);
      }
      setUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setUploadedResume(null);
    setError(null);
    setUploadingProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto flex h-full w-full max-w-[1500px] flex-col justify-center px-5 py-4">
        <div className="w-full space-y-5 animate-fade-in text-center">
          <div>
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
              Upload <span className="text-gradient">Resume</span>
            </h1>
            <p className="text-neutral-400 text-sm font-medium max-w-xl mx-auto uppercase tracking-widest opacity-80">
              Transform your resume into a career roadmap
            </p>
          </div>

          <div className="card-glass relative mx-auto w-full max-w-[1100px] overflow-hidden border-white/5 p-8 group">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl group-hover:bg-primary-600/20 transition-all duration-1000" />
            
            {!uploadedResume ? (
              <div className="space-y-6 relative z-10">
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative w-full min-h-[380px] border-2 border-dashed rounded-[40px] p-12 text-center transition-all duration-500 transform ${
                    dragActive
                      ? 'border-primary-500 bg-primary-500/10 scale-[1.01] shadow-glow-sm'
                      : selectedFile
                      ? 'border-success-500 bg-success-500/5'
                      : 'border-white/10 hover:border-primary-500/50 hover:bg-white/5'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleChange}
                    disabled={uploading}
                  />

                  {!selectedFile ? (
                    <div className="flex min-h-[280px] w-full flex-col items-center justify-center gap-14 py-6 md:flex-row">
                      <div className="w-28 h-28 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-[32px] flex items-center justify-center shadow-inner border border-white/5 group-hover:scale-110 transition-transform duration-500">
                        <Upload className="w-12 h-12 text-primary-400 group-hover:text-primary-300 animate-float" />
                      </div>
                      
                      <div className="text-left space-y-4">
                        <div>
                          <p className="text-4xl font-black text-white tracking-tight leading-none mb-3">
                            Drag & Drop
                          </p>
                          <p className="text-neutral-500 text-xs font-black uppercase tracking-[0.35em]">
                            Supports PDF, DOCX (Max 5MB)
                          </p>
                        </div>

                        <div className="flex items-center gap-6">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="px-9 py-4 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-glow-sm hover:scale-105 active:scale-95 transition-all"
                          >
                            Browse Local Files
                          </button>
                          <div className="flex items-center gap-3">
                            <div className="h-px w-4 bg-white/10" />
                            <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Digital Vault</span>
                            <div className="h-px w-4 bg-white/10" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-[280px] w-full flex-col items-center justify-center py-2 space-y-6 animate-scale-in">
                      <div className="w-20 h-20 bg-success-500/20 rounded-[28px] flex items-center justify-center mx-auto border border-success-500/20 shadow-glow-sm">
                        <FileText className="w-10 h-10 text-success-400" />
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-2xl font-black text-white truncate max-w-md mx-auto">
                          {selectedFile.name}
                        </p>
                        <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for parsing
                        </p>
                      </div>

                      {!uploading && (
                        <button
                          onClick={handleClear}
                          className="text-[10px] font-black text-danger-400 hover:text-danger-300 transition-colors uppercase tracking-[0.3em]"
                        >
                          Cancel Selection
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {uploading && (
                  <div className="space-y-4 py-2 animate-slide-up text-left max-w-3xl mx-auto">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-3">
                         <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
                         <span className="text-white font-black text-[10px] uppercase tracking-widest">
                           Uploading resume...
                         </span>
                      </div>
                      <span className="text-primary-400 font-black tracking-tighter text-2xl italic">
                        {uploadingProgress}%
                      </span>
                    </div>
                    <div className="h-2 bg-neutral-950 rounded-full overflow-hidden border border-white/5 relative">
                      <div
                        className="h-full bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600 transition-all duration-300 relative rounded-full"
                        style={{ width: `${uploadingProgress}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent analysis-progress-bar" />
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-4 p-4 bg-danger-500/10 border border-danger-500/20 rounded-3xl text-left max-w-3xl mx-auto">
                    <div className="p-2 bg-danger-500/20 rounded-xl">
                      <AlertCircle className="w-4 h-4 text-danger-400 flex-shrink-0" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">
                        Process Terminated
                      </p>
                      <p className="text-[11px] text-neutral-400 font-bold mt-0.5">
                        {error}
                      </p>
                    </div>
                    <button onClick={() => setError(null)} className="text-neutral-500 hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {selectedFile && !uploading && (
                  <button
                    onClick={uploadResume}
                    disabled={uploading}
                    className="w-full max-w-3xl mx-auto py-5 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-black uppercase text-xs tracking-[0.3em] rounded-[24px] shadow-glow-sm hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-4"
                  >
                    <Plus className="w-5 h-5" />
                    Upload Resume
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 animate-scale-in">
                <div className="relative inline-block mb-8">
                  <div className="absolute inset-0 bg-success-500/20 blur-3xl rounded-full" />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-success-500 to-emerald-600 rounded-[28px] flex items-center justify-center mx-auto shadow-glow-sm">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                </div>
                
                <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                  Status: <span className="text-success-400">Success</span>
                </h2>
                
                <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.3em] mb-10 max-w-sm mx-auto">
                  Neural parsing complete. Profile identity updated.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <button
                    onClick={() => navigate('/resumes')}
                    className="w-full sm:w-auto px-12 py-4 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-glow-sm hover:scale-105 transition-all"
                  >
                    Enter Command Center
                  </button>
                  <button
                    onClick={handleClear}
                    className="w-full sm:w-auto px-12 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all"
                  >
                    System Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Uploadresume;

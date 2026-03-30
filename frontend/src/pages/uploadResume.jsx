import {useState , useRef} from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, X, Loader2, Target, Code, Map, Award, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout.jsx'
import resumeService from '../services/resumeService.js'
import toast  from 'react-hot-toast'

const Uploadresume = ()=>{

    const navigate = useNavigate()
    const fileInputRef = useRef(null);

    const[dragActive,setDragActive] = useState(false)
    const[uploading,setUploading] = useState(false)
    const[uploadingProgress , setUploadingProgress]= useState(0)
    const[selectedFile, setSelectedFile] = useState(null)
    const[uploadedResume,setUploadedResume] = useState(null)
    const[error,setError] = useState(null)

    const allowedTypes = [
        'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    ]
    const MAX_FILE_SIZE = 5*1024*1024 
    // 5mb
    const validateFile = (file)=>{
        if(!allowedTypes.includes(file.type)){
            return 'Please upload a PDF or Word document (.pdf, .doc, .docx)'
        }
    if(file.size>MAX_FILE_SIZE){
        return 'Please file size must be less than 5MB'
    }
    return null
    }

    // handle file selection
    const handleFileSelect = (file)=>{
        const validationError = validateFile(file)
        if(validationError){
            setError(validationError)
            toast.error(validationError)
            return
        }
        setSelectedFile(file)
        setError(null)
    }

    const handleDrag = (e)=>{
        // it prevent the default action- browser defautlt beh is to open a file
        e.preventDefault();
        e.stopPropagation();
       
        if(e.type === 'dragenter' || e.type === 'dragover'){
            setDragActive(true)

        }else if(e.type === 'dragleave'){
            setDragActive(false)
        }
    }

    // when drag drop also must be perform
    const handleDrop = (e)=>{
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        // now check whether file which ahs dropped have atleast 1 file
        if(e.dataTransfer.files && e.dataTransfer.files[0]){
            handleFileSelect(e.dataTransfer.files[0])
        }
    }

    // it runs when file is selected before drag and drop
    const handleChange = (e) => {
        if (e.target.files && e.target.files[0]) {
          handleFileSelect(e.target.files[0]);
        }
      };

      const uploadResume = async ()=>{
        if(!selectedFile) return 

        try{

            setUploading(true)
            setUploadingProgress(0)
            setDragActive(false)

            const progressInterval = setInterval ( ()=>{
                setUploadingProgress((prev)=>{
                    if(prev>=90){
                        clearInterval(progressInterval)
                        return 90
                    }
                    return prev + 10
                })
            },200)

            // Real flow (important for your project)
            // User uploads file
            // Progress goes 0 → 90 (fake smooth)  
            // Backend responds
            // Then you set:
            // setUploadProgress(100);

            // as file r multimedia it contains binary so we put it in converts data into multipart/form-data
            const formData = new FormData()
            formData.append('resume',selectedFile)

            const response = await resumeService.uploadResume(formData)

            setUploadingProgress(100)

            setUploadedResume(response.data)
            toast.success('Resume successfully uploaded and parsed')

            // redirect to user after 2 seconds
            setTimeout(()=>{
                navigate('/resumes')
            },2000)

        }catch(error){
            console.error('Upload error:', error);
      setError(error.response?.data?.message || 'Failed to upload resume');
      toast.error('Upload failed. Please try again.');
      setUploadingProgress(0);
        }finally{
            setUploading(false);
        }
      }

      // Clear selection
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
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          
          <div className="flex-1 space-y-8 animate-fade-in">
            <div>
              {/* Header */}
              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                Upload <span className="text-gradient">Resume</span>
              </h1>
              <p className="text-neutral-400 font-medium">
                Our AI will analyze your resume to identify skill gaps and provide personalized roadmaps.
              </p>
            </div>

            {/* Upload Area */}
            <div className="card-glass p-8 relative overflow-hidden group">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-600/10 rounded-full blur-3xl group-hover:bg-primary-600/20 transition-all duration-700" />
              
              {!uploadedResume ? (
                <div className="space-y-6 relative z-10">
                  {/* Drag & Drop Zone */}
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-xl3 p-12 text-center transition-all duration-500 transform ${
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
                      <div className="space-y-5">
                        <div className="w-24 h-24 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-white/5 group-hover:scale-110 transition-transform duration-500">
                          <Upload className="w-12 h-12 text-primary-400 group-hover:text-primary-300 animate-float" />
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-xl font-bold text-white">
                            Drag & Drop your resume
                          </p>
                          <p className="text-neutral-400 text-sm font-medium">
                            Support for PDF, DOCX up to 5MB
                          </p>
                        </div>

                        <div className="flex items-center justify-center gap-4">
                           <div className="h-px w-8 bg-white/10" />
                           <span className="text-xs font-black text-neutral-600 uppercase tracking-widest">or</span>
                           <div className="h-px w-8 bg-white/10" />
                        </div>

                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="px-8 py-3.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-bold rounded-xl shadow-glow-sm hover:scale-105 transition-all"
                        >
                          Browse Files
                        </button>
                      </div>
                    ) : (
                      <div className="py-6 space-y-5 animate-scale-in">
                        <div className="w-24 h-24 bg-success-500/20 rounded-2xl flex items-center justify-center mx-auto border border-success-500/20 shadow-glow-sm">
                          <FileText className="w-12 h-12 text-success-400" />
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-xl font-bold text-white truncate max-w-xs mx-auto">
                            {selectedFile.name}
                          </p>
                          <p className="text-neutral-400 text-sm font-medium">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to analyze
                          </p>
                        </div>

                        {!uploading && (
                          <button
                            onClick={handleClear}
                            className="text-sm font-bold text-danger-400 hover:text-danger-300 transition-colors uppercase tracking-widest"
                          >
                            Remove file
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Upload Progress */}
                  {uploading && (
                    <div className="space-y-4 py-4 animate-slide-up">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
                           <span className="text-white font-bold tracking-tight">
                             AI is parsing your data...
                           </span>
                        </div>
                        <span className="text-primary-400 font-black tracking-tighter text-lg">
                          {uploadingProgress}%
                        </span>
                      </div>
                      <div className="h-2.5 bg-neutral-950 rounded-full overflow-hidden border border-white/5 relative">
                        <div
                          className="h-full bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600 transition-all duration-300 relative rounded-full"
                          style={{ width: `${uploadingProgress}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent analysis-progress-bar" />
                        </div>
                      </div>
                      <p className="text-center text-xs text-neutral-500 font-medium">
                        Estimated time remaining: <span className="text-neutral-400">~15s</span>
                      </p>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="flex items-start gap-4 p-5 bg-danger-500/10 border border-danger-500/20 rounded-2xl">
                      <div className="p-2 bg-danger-500/20 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-danger-400 flex-shrink-0" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white capitalize">
                          Upload Failed
                        </p>
                        <p className="text-sm text-neutral-400 font-medium mt-0.5">
                          {error}
                        </p>
                      </div>
                      <button onClick={() => setError(null)} className="text-neutral-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  {/* Upload Button */}
                  {selectedFile && !uploading && (
                    <button
                      onClick={uploadResume}
                      disabled={uploading}
                      className="w-full py-4 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-bold rounded-xl shadow-glow-sm hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5 mr-1" />
                      Launch AI Analysis
                    </button>
                  )}
                </div>
              ) : (
                // Success State
                <div className="text-center py-12 animate-scale-in">
                  <div className="relative inline-block mb-8">
                    <div className="absolute inset-0 bg-success-500/20 blur-3xl rounded-full" />
                    <div className="relative w-24 h-24 bg-gradient-to-br from-success-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-glow-sm">
                      <CheckCircle className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  
                  <h2 className="text-3xl font-black text-white mb-3 tracking-tight">
                    Analysis <span className="text-success-400">Complete!</span>
                  </h2>
                  
                  <p className="text-neutral-400 font-medium mb-10 max-w-sm mx-auto">
                    Your resume has been successfully parsed. We've extracted your experience, skills, and projects.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                      onClick={() => navigate('/resumes')}
                      className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-bold rounded-xl shadow-glow-sm hover:scale-105 transition-all"
                    >
                      View My Profile
                    </button>
                    <button
                      onClick={handleClear}
                      className="w-full sm:w-auto px-8 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-xl transition-all"
                    >
                      Upload Another
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary-600/20 to-primary-600/5 border border-white/5 hover:-translate-y-1 transition-all duration-300">
                <div className="p-3 rounded-xl bg-white/5 w-fit mb-4 border border-white/5">
                  <Target className="w-6 h-6 text-primary-400" />
                </div>
                <h4 className="font-bold text-white mb-2 tracking-tight">Skill Matching</h4>
                <p className="text-xs text-neutral-500 font-medium leading-relaxed">We match your skills against hundreds of job roles.</p>
              </div>
              <div className="p-6 rounded-2xl bg-gradient-to-br from-accent-600/20 to-accent-600/5 border border-white/5 hover:-translate-y-1 transition-all duration-300">
                <div className="p-3 rounded-xl bg-white/5 w-fit mb-4 border border-white/5">
                  <Code className="w-6 h-6 text-accent-400" />
                </div>
                <h4 className="font-bold text-white mb-2 tracking-tight">Gap Analysis</h4>
                <p className="text-xs text-neutral-500 font-medium leading-relaxed">Identify exactly what skills you're missing for a role.</p>
              </div>
              <div className="p-6 rounded-2xl bg-gradient-to-br from-energy-600/20 to-energy-600/5 border border-white/5 hover:-translate-y-1 transition-all duration-300">
                <div className="p-3 rounded-xl bg-white/5 w-fit mb-4 border border-white/5">
                  <Map className="w-6 h-6 text-energy-400" />
                </div>
                <h4 className="font-bold text-white mb-2 tracking-tight">AI Roadmap</h4>
                <p className="text-xs text-neutral-500 font-medium leading-relaxed">Get a step-by-step learning path to bridge gaps.</p>
              </div>
            </div>
          </div>

          <div className="lg:w-80 space-y-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            
            <div className="card-glass p-6 border-primary-500/20 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-primary-600/5 rounded-full -mr-12 -mt-12 blur-2xl" />
               <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                 <Award className="w-5 h-5 text-primary-400" />
                 PRO TIPS
               </h3>
               <ul className="space-y-4">
                 {[
                   {title: "Use Keywords", desc: "Include industry-standard terms for better skill extraction."},
                   {title: "Clean Layout", desc: "Standard fonts and clear headers help our AI parse better."},
                   {title: "Action Verbs", desc: "Start experience entries with words like 'Developed', 'Managed'."},
                   {title: "PDF Format", desc: "We recommend PDF for the most reliable parsing results."}
                 ].map((tip, i) => (
                   <li key={i} className="flex gap-3 items-start">
                     <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
                     <div className="space-y-0.5">
                       <h5 className="text-xs font-black text-neutral-300 uppercase tracking-wider">{tip.title}</h5>
                       <p className="text-[11px] text-neutral-500 font-medium leading-normal">{tip.desc}</p>
                     </div>
                   </li>
                 ))}
               </ul>
            </div>

            <div className="p-6 rounded-xl2 bg-neutral-900/40 border border-white/5">
                <div className="flex items-center gap-3 mb-4">
                   <div className="p-2 bg-success-500/10 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-success-400" />
                   </div>
                   <h4 className="text-sm font-black text-white tracking-widest uppercase">Safe & Secure</h4>
                </div>
                <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                  Your resume is processed using enterprise-grade encryption. We never share your data with third parties.
                </p>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
export default Uploadresume

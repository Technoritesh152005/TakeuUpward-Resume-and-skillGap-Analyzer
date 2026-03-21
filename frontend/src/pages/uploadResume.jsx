import {useState , useRef} from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';
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
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
            Upload Resume
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Upload your resume to get started with AI-powered analysis
          </p>
        </div>

        {/* Upload Area */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 border border-neutral-200 dark:border-neutral-700">
          {!uploadedResume ? (
            <div className="space-y-6">
              {/* Drag & Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                  dragActive
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : selectedFile
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-400 dark:hover:border-primary-500'
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
                  <div className="space-y-4">
                    <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto">
                      <Upload className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                    </div>
                    
                    <div>
                      <p className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                        Drag and drop your resume here
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                        or click to browse
                      </p>
                    </div>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Choose File
                    </button>

                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Supported formats: PDF, DOC, DOCX (Max 5MB)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto">
                      <FileText className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    
                    <div>
                      <p className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
                        {selectedFile.name}
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>

                    {!uploading && (
                      <button
                        onClick={handleClear}
                        className="text-sm text-red-600 dark:text-red-400 hover:underline"
                      >
                        Remove file
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      Uploading and parsing...
                    </span>
                    <span className="font-semibold text-primary-600 dark:text-primary-400">
                      {uploadingProgress}%
                    </span>
                  </div>
                  <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300 relative overflow-hidden"
                      style={{ width: `${uploadingProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900 dark:text-red-200">
                      Upload Failed
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {error}
                    </p>
                  </div>
                  <button onClick={() => setError(null)}>
                    <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              )}

              {/* Upload Button */}
              {selectedFile && !uploading && (
                <button
                  onClick={uploadResume}
                  disabled={uploading}
                  className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload & Parse Resume
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            // Success State
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                Resume Uploaded Successfully!
              </h2>
              
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                Your resume has been parsed and is ready for analysis
              </p>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => navigate('/resumes')}
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                >
                  View My Resumes
                </button>
                <button
                  onClick={handleClear}
                  className="px-6 py-3 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-xl hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                >
                  Upload Another
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
              AI-Powered Parsing
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Our AI extracts all relevant information from your resume automatically
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl p-6">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
              Secure & Private
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Your data is encrypted and only accessible by you
            </p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
              Multiple Formats
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Supports PDF, DOC, and DOCX file formats
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
export default Uploadresume
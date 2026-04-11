import { useState, useEffect } from 'react';
import { Eye, Trash2, Calendar, Upload, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import DashboardLayout from '../components/layout/DashboardLayout.jsx'
import resumeService from '../services/resumeService.js';
import toast from 'react-hot-toast';

const resumePage = ()=> {
    const navigate = useNavigate()
    const [resume,setResume] = useState([])
    const [loading, setLoading] = useState(true)
    const [page,setPage] = useState(1)
    const [totalPage , setTotalPage] = useState(1)
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(()=>{
        fetchResume()
    },[page])

    const fetchResume = async ()=>{

        try{
            setLoading(true)
            const response = await resumeService.getMyResume(page, 9)
            setResume(response.data?.docs || [])
            setTotalPage(response.data?.totalPages || 1)
        }catch(error){
            console.error('Failed to fetch resumes:', error);
            toast.error('Failed to load resumes');
        }finally{
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        try{
            setLoading(true)
            const data = await resumeService.deleteResume(id)
            toast.success('Resume deleted successfully')
            setDeleteConfirm(null)
            // aftee deleting fetch the new resume list
            fetchResume()
            await fetchResume()
        }catch(error){
            console.error('Failed to delete resume:', error);
      toast.error('Failed to delete resume');
        }finally{
            setLoading(false)
        }
    }

    const getFileIcon = (mimeType) => {
        if (mimeType?.includes('pdf')) {
          return '📄';
        } else if (mimeType?.includes('word') || mimeType?.includes('document')) {
          return '📝';
        }
        return '📋';
      };

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tight">
              My <span className="text-gradient">Resumes</span>
            </h1>
            <p className="text-neutral-400 font-medium">
              Manage and analyze your professional documents with AI.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/upload')}
              className="btn-gradient px-6 py-3 shadow-glow-sm"
            >
              <Plus className="w-5 h-5 drop-shadow-md" />
              Upload New
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card-glass p-8 border-white/5 animate-pulse">
                <div className="h-20 w-20 bg-white/5 rounded-2xl mb-6" />
                <div className="h-7 bg-white/5 rounded-lg mb-3 w-3/4" />
                <div className="h-4 bg-white/5 rounded-lg w-1/2 mb-6" />
                <div className="h-12 bg-white/5 rounded-xl w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && resume.length === 0 && (
          <div className="card-glass p-16 text-center relative overflow-hidden group">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-600/10 rounded-full blur-[100px] group-hover:bg-primary-600/20 transition-all duration-700" />
            <div className="relative z-10 space-y-6">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-3xl flex items-center justify-center mx-auto border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Upload className="w-12 h-12 text-primary-400 animate-float" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white tracking-tight">
                  No Resumes Found
                </h2>
                <p className="text-neutral-400 font-medium max-w-xs mx-auto">
                  Upload your first resume to get started with AI-powered skill analysis.
                </p>
              </div>
              <button
                onClick={() => navigate('/upload')}
                className="btn-gradient px-10 py-4 text-base"
              >
                Upload Your First Resume
              </button>
            </div>
          </div>
        )}

        {/* Resumes Grid */}
        {!loading && resume.length > 0 && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {resume.map((item) => (
                <div
                  key={item._id}
                  className="card-hover p-6 border-white/5 relative overflow-hidden group"
                >
                  {/* Backdrop Gradient */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary-600/10 transition-all duration-500" />
                  
                  {/* File Icon */}
                  <div className="relative z-10 w-16 h-16 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 group-hover:border-primary-500/30 group-hover:shadow-glow-sm transition-all duration-500">
                    <span className="text-3xl drop-shadow-lg">{getFileIcon(item.mimeType)}</span>
                  </div>

                  {/* Resume Info */}
                  <div className="relative z-10 space-y-4 mb-8">
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-white truncate group-hover:text-primary-300 transition-colors">
                        {item.originalFileName}
                      </h3>
                      <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-widest">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {item.createdAt
                            ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })
                            : 'Recently'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-3 border-y border-white/5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em]">Size</span>
                        <span className="text-sm font-bold text-neutral-300">
                          {(Number(item.fileSize) / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em]">Status</span>
                        <div className="flex items-center gap-2">
                           {item.processingStatus !== 'completed' && (
                             <span className="relative flex h-2 w-2">
                               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning-400 opacity-75"></span>
                               <span className="relative inline-flex rounded-full h-2 w-2 bg-warning-500"></span>
                             </span>
                           )}
                           <span className={`text-xs font-black uppercase tracking-wider ${
                             item.processingStatus === 'completed'
                               ? 'text-success-400'
                               : 'text-warning-400'
                           }`}>
                             {item.processingStatus || 'Processing'}
                           </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="relative z-10 flex items-center gap-3">
                    <button
                      onClick={() => navigate(`/resumes/${item._id}`)}
                      className="flex-1 btn-primary py-2.5 bg-white/10 hover:bg-white/20 border-white/10 text-white shadow-none hover:shadow-glow-sm group/btn"
                    >
                      <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      <span className="text-sm font-bold uppercase tracking-widest">View Profile</span>
                    </button>
                    
                    <button
                      onClick={() => setDeleteConfirm(item._id)}
                      className="p-2.5 bg-danger-500/10 text-danger-400 border border-danger-500/20 rounded-xl hover:bg-danger-500/20 hover:text-danger-300 transition-all group/del"
                      title="Delete"
                    >
                      <Trash2 className="w-4.5 h-4.5 group-hover/del:rotate-12 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPage > 1 && (
              <div className="flex items-center justify-center gap-6 py-6 border-t border-white/5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-ghost p-3 bg-white/5 hover:bg-white/10 text-white disabled:opacity-20 transition-all rounded-full"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-2">
                   <span className="text-sm font-black text-white">Page {page}</span>
                   <span className="text-sm font-bold text-neutral-600 uppercase tracking-widest">of {totalPage}</span>
                </div>
                
                <button
                  onClick={() => setPage((p) => Math.min(totalPage, p + 1))}
                  disabled={page === totalPage}
                  className="btn-ghost p-3 bg-white/5 hover:bg-white/10 text-white disabled:opacity-20 transition-all rounded-full"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-6 animate-fade-in">
            <div className="card-glass max-w-md w-full p-8 border-danger-500/20 animate-scale-in">
              <div className="w-16 h-16 bg-danger-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-danger-500/20">
                <Trash2 className="w-8 h-8 text-danger-400" />
              </div>
              <div className="text-center space-y-2 mb-8">
                <h3 className="text-2xl font-black text-white tracking-tight uppercase">
                  Delete Resume?
                </h3>
                <p className="text-neutral-400 font-medium">
                  This action is permanent and will remove all associated AI analytics.
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-3.5 bg-danger-600 hover:bg-danger-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-danger-600/20 uppercase tracking-widest text-xs"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
export default resumePage

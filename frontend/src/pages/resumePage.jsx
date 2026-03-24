import { useState, useEffect } from 'react';
import { FileText, Eye, Trash2, Download, Calendar, Upload, Plus } from 'lucide-react';
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
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                  My Resumes
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Manage your uploaded resumes
                </p>
              </div>
              <button
                onClick={() => navigate('/upload')}
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Upload New
              </button>
            </div>
    
            {/* Loading State */}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 animate-pulse">
                    <div className="h-20 w-20 bg-neutral-200 dark:bg-neutral-700 rounded-2xl mb-4" />
                    <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded mb-2" />
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3 mb-4" />
                    <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded" />
                  </div>
                ))}
              </div>
            )}
    
            {/* Empty State */}
            {!loading && resume.length === 0 && (
              <div className="bg-white dark:bg-neutral-800 rounded-2xl p-12 border border-neutral-200 dark:border-neutral-700 text-center">
                <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Upload className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                  No Resumes Yet
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                  Upload your first resume to get started with AI-powered analysis
                </p>
                <button
                  onClick={() => navigate('/upload')}
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                >
                  Upload Resume
                </button>
              </div>
            )}
    
            {/* Resumes Grid */}
            {!loading && resume.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {resume.map((item) => (
                    <div
                      key={item._id}
                      className="group bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 hover:shadow-xl hover:shadow-neutral-200/50 dark:hover:shadow-neutral-900/50 transition-all duration-300 hover:-translate-y-1"
                    >
                      {/* File Icon */}
                      <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-4xl">{getFileIcon(item.mimeType)}</span>
                      </div>
    
                      {/* Resume Info */}
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1 truncate">
                          {item.originalFileName}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {item.createdAt
                              ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })
                              : 'Recently'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-500">
                          <span>{(Number(item.fileSize) / 1024 / 1024).toFixed(2)} MB</span>
                          <span>•</span>
                          <span className={`px-2 py-0.5 rounded-full ${
                            item.parsedData?.processingStatus === 'completed'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                          }`}>
                            {item.parsedData?.processingStatus || 'Processing'}
                          </span>
                        </div>
                      </div>
    
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/resumes/${item._id}`)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-sm font-medium">View</span>
                        </button>
                        
                        <button
                          onClick={() => setDeleteConfirm(item._id)}
                          className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
    
                {/* Pagination */}
                {totalPage > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      Page {page} of {totalPage}
                    </span>
                    
                    <button
                      onClick={() => setPage((p) => Math.min(totalPage, p + 1))}
                      disabled={page === totalPage}
                      className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
    
            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-neutral-200 dark:border-neutral-700">
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                    Delete Resume?
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                    This action cannot be undone. The resume will be permanently deleted.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(deleteConfirm)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete
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
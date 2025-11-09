import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { Upload, File, Trash2, CheckCircle, XCircle, Clock, FileText, FileImage, FileCode, X, Tag, Plus } from 'lucide-react';
import { documentsApi, tagsApi } from '@/api/client';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatDate, formatFileSize } from '@/utils/format';
import type { Document, Tag as TagType } from '@/types';
import { useToast } from '@/contexts/ToastContext';

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export default function DocumentsPage() {
  const toast = useToast();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#0ea5e9');
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.list(),
  });

  const { data: stats } = useQuery({
    queryKey: ['document-stats'],
    queryFn: () => documentsApi.getStats(),
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => documentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-stats'] });
      toast.success('Document deleted', 'Document was successfully removed');
    },
    onError: () => {
      toast.error('Delete failed', 'Failed to delete document');
    },
  });

  const createTagMutation = useMutation({
    mutationFn: () => tagsApi.create(newTagName, newTagColor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setShowCreateTag(false);
      setNewTagName('');
      setNewTagColor('#0ea5e9');
      toast.success('Tag created', `Tag "${newTagName}" created successfully`);
    },
    onError: () => {
      toast.error('Failed to create tag', 'Please try again');
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id: number) => tagsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Tag deleted', 'Tag removed successfully');
    },
    onError: () => {
      toast.error('Failed to delete tag', 'Please try again');
    },
  });

  const uploadFile = async (file: File) => {
    // Add to uploading files
    const uploadingFile: UploadingFile = {
      file,
      progress: 0,
      status: 'uploading',
    };

    setUploadingFiles((prev) => [...prev, uploadingFile]);

    try {
      // Simulate progress (in real implementation, use XHR with progress events)
      const progressInterval = setInterval(() => {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.file === file && f.progress < 90
              ? { ...f, progress: f.progress + 10 }
              : f
          )
        );
      }, 200);

      // Upload file
      await documentsApi.upload(file);

      clearInterval(progressInterval);

      // Set to processing
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.file === file
            ? { ...f, progress: 100, status: 'processing' }
            : f
        )
      );

      // Wait a bit for processing simulation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Set to completed
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.file === file
            ? { ...f, status: 'completed' }
            : f
        )
      );

      // Remove from uploading files after 2 seconds
      setTimeout(() => {
        setUploadingFiles((prev) => prev.filter((f) => f.file !== file));
      }, 2000);

      // Refresh documents list
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-stats'] });
    } catch (error: any) {
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.file === file
            ? { ...f, status: 'error', error: error.message || 'Upload failed' }
            : f
        )
      );
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      uploadFile(file);
    });
  };

  const removeUploadingFile = (file: File) => {
    setUploadingFiles((prev) => prev.filter((f) => f.file !== file));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/markdown': ['.md'],
    },
  });

  return (
    <div className="h-screen overflow-auto bg-gray-50">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-600 mt-2">
            Upload and manage knowledge base documents for the AI assistant
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="card">
              <p className="text-sm text-gray-600">Total Documents</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total_documents}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.completed_documents}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Total Chunks</p>
              <p className="text-3xl font-bold text-primary-600 mt-1">{stats.total_chunks}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Embedding Model</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{stats.embedding_model}</p>
            </div>
          </div>
        )}

        {/* Tags Management */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Tags</h2>
            <button
              onClick={() => setShowCreateTag(true)}
              className="btn-primary text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Tag
            </button>
          </div>

          {/* Create Tag Form */}
          {showCreateTag && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium mb-3">Create New Tag</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Tag name"
                  className="input flex-1"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <button
                    onClick={() => createTagMutation.mutate()}
                    disabled={!newTagName.trim() || createTagMutation.isPending}
                    className="btn-primary"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateTag(false);
                      setNewTagName('');
                      setNewTagColor('#0ea5e9');
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tags List */}
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                  style={{ backgroundColor: tag.color + '20', color: tag.color }}
                >
                  <Tag className="w-3 h-3" />
                  <span className="font-medium">{tag.name}</span>
                  <span className="text-xs opacity-70">({tag.document_count || 0})</span>
                  <button
                    onClick={() => deleteTagMutation.mutate(tag.id)}
                    className="ml-1 hover:opacity-70"
                    title="Delete tag"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No tags created yet. Create your first tag to organize documents.</p>
          )}
        </div>

        {/* Upload area */}
        <div className="card mb-8">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-lg text-primary-600">Drop the files here...</p>
            ) : (
              <>
                <p className="text-lg text-gray-700 mb-2">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Supported formats: PDF, TXT, DOCX, MD
                </p>
              </>
            )}
          </div>

          {/* Uploading files */}
          {uploadingFiles.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Uploading files</h3>
              {uploadingFiles.map((uploadingFile, index) => (
                <UploadingFileItem
                  key={index}
                  uploadingFile={uploadingFile}
                  onRemove={() => removeUploadingFile(uploadingFile.file)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Documents list */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Documents</h2>

          {isLoading ? (
            <LoadingSpinner />
          ) : documents && documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc) => (
                <DocumentItem
                  key={doc.id}
                  document={doc}
                  onDelete={() => deleteMutation.mutate(doc.id)}
                  availableTags={tags}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <File className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No documents uploaded yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadingFileItem({
  uploadingFile,
  onRemove
}: {
  uploadingFile: UploadingFile;
  onRemove: () => void;
}) {
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <FileText className="w-6 h-6 text-red-500" />;
      case 'txt':
      case 'md':
        return <FileText className="w-6 h-6 text-blue-500" />;
      case 'docx':
        return <FileText className="w-6 h-6 text-blue-600" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <FileImage className="w-6 h-6 text-purple-500" />;
      default:
        return <FileCode className="w-6 h-6 text-gray-500" />;
    }
  };

  const statusText = {
    uploading: `Uploading... ${uploadingFile.progress}%`,
    processing: 'Processing...',
    completed: 'Completed!',
    error: 'Failed',
  };

  const statusColor = {
    uploading: 'text-blue-600',
    processing: 'text-yellow-600',
    completed: 'text-green-600',
    error: 'text-red-600',
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex-shrink-0">
        {getFileIcon(uploadingFile.file.name)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="font-medium text-sm text-gray-900 truncate">
            {uploadingFile.file.name}
          </p>
          <span className={`text-xs font-medium ${statusColor[uploadingFile.status]}`}>
            {statusText[uploadingFile.status]}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <span>{formatFileSize(uploadingFile.file.size)}</span>
        </div>

        {/* Progress bar */}
        {(uploadingFile.status === 'uploading' || uploadingFile.status === 'processing') && (
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                uploadingFile.status === 'processing'
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${uploadingFile.progress}%` }}
            />
          </div>
        )}

        {uploadingFile.status === 'completed' && (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs">Upload successful</span>
          </div>
        )}

        {uploadingFile.status === 'error' && uploadingFile.error && (
          <p className="text-xs text-red-600">{uploadingFile.error}</p>
        )}
      </div>

      {uploadingFile.status === 'error' && (
        <button
          onClick={onRemove}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          title="Remove"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function DocumentItem({
  document,
  onDelete,
  availableTags
}: {
  document: Document;
  onDelete: () => void;
  availableTags: TagType[];
}) {
  const queryClient = useQueryClient();
  const [showTagMenu, setShowTagMenu] = useState(false);

  const addTagMutation = useMutation({
    mutationFn: (tagId: number) => tagsApi.addToDocument(document.id, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  const removeTagMutation = useMutation({
    mutationFn: (tagId: number) => tagsApi.removeFromDocument(document.id, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  const documentTagIds = document.tags?.map((t) => t.id) || [];
  const availableTagsToAdd = availableTags.filter((t) => !documentTagIds.includes(t.id));

  const statusIcons = {
    pending: <Clock className="w-5 h-5 text-yellow-500" />,
    processing: <Clock className="w-5 h-5 text-blue-500 animate-spin" />,
    completed: <CheckCircle className="w-5 h-5 text-green-500" />,
    failed: <XCircle className="w-5 h-5 text-red-500" />,
  };

  const statusColors = {
    pending: 'bg-yellow-50 text-yellow-700',
    processing: 'bg-blue-50 text-blue-700',
    completed: 'bg-green-50 text-green-700',
    failed: 'bg-red-50 text-red-700',
  };

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
      <div className="flex items-center gap-4 flex-1">
        <File className="w-8 h-8 text-gray-400" />

        <div className="flex-1">
          <p className="font-medium text-gray-900">{document.filename}</p>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span>{formatFileSize(document.file_size)}</span>
            <span>•</span>
            <span>{document.chunks_count} chunks</span>
            <span>•</span>
            <span>{formatDate(document.upload_date)}</span>
          </div>
          {document.error_message && (
            <p className="text-sm text-red-600 mt-1">{document.error_message}</p>
          )}

          {/* Document Tags */}
          {document.tags && document.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {document.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: tag.color + '20', color: tag.color }}
                >
                  <Tag className="w-2.5 h-2.5" />
                  {tag.name}
                  <button
                    onClick={() => removeTagMutation.mutate(tag.id)}
                    className="ml-0.5 hover:opacity-70"
                    title="Remove tag"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {statusIcons[document.status]}
          <span className={`text-xs px-2 py-1 rounded ${statusColors[document.status]}`}>
            {document.status}
          </span>
        </div>

        {/* Add Tag Button */}
        <div className="relative">
          <button
            onClick={() => setShowTagMenu(!showTagMenu)}
            className="p-2 text-primary-600 hover:bg-primary-50 rounded transition-colors"
            title="Add tag"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Tag Dropdown */}
          {showTagMenu && availableTagsToAdd.length > 0 && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="p-2 max-h-48 overflow-y-auto">
                {availableTagsToAdd.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      addTagMutation.mutate(tag.id);
                      setShowTagMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Tag
                      className="w-3 h-3"
                      style={{ color: tag.color }}
                    />
                    <span className="text-sm">{tag.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onDelete}
          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Delete document"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

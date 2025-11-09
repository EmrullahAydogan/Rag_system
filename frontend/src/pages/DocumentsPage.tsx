import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { Upload, File, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { documentsApi } from '@/api/client';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatDate, formatFileSize } from '@/utils/format';
import type { Document } from '@/types';

export default function DocumentsPage() {
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.list(),
  });

  const { data: stats } = useQuery({
    queryKey: ['document-stats'],
    queryFn: () => documentsApi.getStats(),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => documentsApi.upload(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-stats'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => documentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-stats'] });
    },
  });

  const onDrop = (acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      uploadMutation.mutate(file);
    });
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

          {uploadMutation.isPending && (
            <div className="mt-4">
              <LoadingSpinner size="sm" />
              <p className="text-sm text-gray-600 text-center mt-2">Uploading and processing...</p>
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

function DocumentItem({ document, onDelete }: { document: Document; onDelete: () => void }) {
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
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {statusIcons[document.status]}
          <span className={`text-xs px-2 py-1 rounded ${statusColors[document.status]}`}>
            {document.status}
          </span>
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

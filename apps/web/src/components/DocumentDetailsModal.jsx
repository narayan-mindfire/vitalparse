import React from 'react';
import { X } from 'lucide-react';

const DocumentDetailsModal = ({ isOpen, onClose, document }) => {
  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col relative">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Document Details</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Filename</p>
              <p className="text-gray-900 font-medium">{document.filename}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Status</p>
              <p className="text-gray-900 font-medium">{document.status}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Created At</p>
              <p className="text-gray-900 font-medium">{new Date(document.created_at).toLocaleString()}</p>
            </div>
            {document.failure_reason && (
              <div className="col-span-2">
                <p className="text-xs text-red-500 uppercase tracking-wider font-semibold">Failure Reason</p>
                <p className="text-red-700 bg-red-50 p-3 rounded-lg mt-1 text-sm border border-red-100">{document.failure_reason}</p>
              </div>
            )}
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Raw JSON Output</h3>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-green-400 text-xs font-mono">
                {document.raw_extracted_json 
                  ? JSON.stringify(document.raw_extracted_json, null, 2) 
                  : 'No JSON data available.'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetailsModal;

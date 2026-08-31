import React from 'react';
import { Eye, RefreshCw } from 'lucide-react';
import { retryDocument } from '../services/api';

const statusColors = {
  Success: 'bg-green-100 text-green-800',
  'Needs Review': 'bg-yellow-100 text-yellow-800',
  Failed: 'bg-red-100 text-red-800',
  Pending: 'bg-blue-100 text-blue-800'
};

const DocumentTable = ({ documents, onRefresh, onViewDetails }) => {
  
  const handleRetry = async (id) => {
    try {
      await retryDocument(id);
      onRefresh();
    } catch (err) {
      console.error('Retry failed', err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Measure</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No documents found. Upload one to get started.
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {doc.filename}
                    {doc.patient_age && <span className="ml-2 text-xs text-gray-500">(Age: {doc.patient_age})</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {doc.document_type || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-semibold">
                    {doc.measure || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[doc.status] || 'bg-gray-100 text-gray-800'}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {doc.confidence_score ? `${(doc.confidence_score * 100).toFixed(0)}%` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                    <button 
                      onClick={() => onViewDetails(doc)}
                      className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md hover:bg-indigo-50 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {(doc.status === 'Failed' || doc.status === 'Needs Review') && (
                      <button 
                        onClick={() => handleRetry(doc.id)}
                        className="text-orange-600 hover:text-orange-900 p-1 rounded-md hover:bg-orange-50 transition-colors"
                        title="Retry Processing"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DocumentTable;

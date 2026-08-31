import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DocumentTable from './components/DocumentTable';
import UploadModal from './components/UploadModal';
import DocumentDetailsModal from './components/DocumentDetailsModal';
import { getDocuments } from './services/api';
import { FileUp, FileText, CheckCircle, Clock } from 'lucide-react';

function App() {
  const [documents, setDocuments] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await getDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Failed to fetch documents', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    const interval = setInterval(fetchDocuments, 10000); // Auto refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const totalProcessed = documents.length;
  const successCount = documents.filter(d => d.status === 'Success').length;
  const pendingCount = documents.filter(d => d.status === 'Pending').length;
  const successRate = totalProcessed > 0 ? ((successCount / totalProcessed) * 100).toFixed(0) : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Overview of clinical document processing</p>
          </div>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <FileUp className="w-5 h-5" />
            Upload Document
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Processed</p>
              <p className="text-2xl font-bold text-gray-900">{totalProcessed}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-lg text-green-600">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{successRate}%</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="p-3 bg-yellow-50 rounded-lg text-yellow-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Pending Queue</p>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="mb-4 flex justify-between items-end">
          <h2 className="text-lg font-semibold text-gray-800">Recent Documents</h2>
        </div>

        {loading && documents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Loading documents...</div>
        ) : (
          <DocumentTable 
            documents={documents} 
            onRefresh={fetchDocuments}
            onViewDetails={(doc) => {
              setSelectedDocument(doc);
              setIsDetailsModalOpen(true);
            }} 
          />
        )}
      </main>

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={fetchDocuments}
      />

      <DocumentDetailsModal 
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        document={selectedDocument}
      />
    </div>
  );
}

export default App;

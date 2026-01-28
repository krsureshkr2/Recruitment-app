
import React from 'react';
import { Candidate } from '../types';
import { X, Download, Maximize2, FileText, Hash, FileDown } from 'lucide-react';

interface DocumentViewerProps {
  candidate: Candidate;
  onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ candidate, onClose }) => {
  const isPdf = candidate.fileType?.includes('pdf');

  const handleDownload = () => {
    if (!candidate.fileDataUrl) {
      alert("No local file data available for download.");
      return;
    }
    const link = document.createElement('a');
    link.href = candidate.fileDataUrl;
    link.download = candidate.fileName || `CV_${candidate.name.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-8 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-6xl h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                {candidate.fileName || 'CV Document'}
                <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-mono">
                  {candidate.fileSize || 'Unknown Size'}
                </span>
              </h2>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                <Hash size={10} />
                ARCHIVE-ID: {candidate.fileReferenceId}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              <FileDown size={16} />
              DOWNLOAD DOCUMENT
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1" />
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 bg-slate-200 overflow-hidden relative">
          {candidate.fileDataUrl ? (
            isPdf ? (
              <iframe 
                src={`${candidate.fileDataUrl}#toolbar=0`} 
                className="w-full h-full border-none bg-white"
                title="PDF Preview"
              />
            ) : (
              <div className="w-full h-full bg-slate-900 p-12 overflow-y-auto text-slate-300 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                {/* Basic data preview for non-PDFs if readable as text */}
                <div className="max-w-4xl mx-auto border border-slate-700 p-8 rounded-xl bg-slate-800/50">
                  <p className="text-slate-500 mb-8 uppercase text-[10px] font-black tracking-widest border-b border-slate-700 pb-2">Non-PDF Binary Preview (Raw Content)</p>
                  {(() => {
                    try {
                      return atob(candidate.fileDataUrl.split(',')[1]).slice(0, 10000);
                    } catch (e) {
                      return "Binary content cannot be previewed. Please use the Download button to view this document.";
                    }
                  })()}
                </div>
              </div>
            )
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-4 bg-slate-50">
               <FileText size={64} className="opacity-10" />
               <p className="font-bold text-slate-500">Original file data not found in local session.</p>
               <button onClick={handleDownload} className="text-blue-600 font-bold hover:underline">Try Download Anyway</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;

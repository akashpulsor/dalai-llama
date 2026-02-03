import React, { useState } from 'react';
import { 
  ShieldCheck, Upload, FileText, X, AlertCircle, 
  CheckCircle2, Loader2, Info, Building2, Briefcase 
} from 'lucide-react';

/**
 * @typedef {Object} KYCFile
 * @property {string} id - Unique ID for the file.
 * @property {string} name - File name.
 * @property {number} size - File size in bytes.
 * @property {'PENDING' | 'UPLOADING' | 'SUCCESS'} status - Current upload status.
 */

/**
 * @typedef {Object} KYCVerificationProps
 * @property {string} workspaceId - The unique ID of the provisioned workspace.
 * @property {() => void} onClose - Callback to close the KYC modal/view.
 * @property {(data: any) => void} onComplete - Callback triggered when documents are submitted.
 */

/**
 * KYCVerification component for business identity validation.
 * Features a mock file upload system with state management for different document types.
 * * @component
 * @param {KYCVerificationProps} props
 * @returns {React.JSX.Element}
 */
export const KYCVerification = ({ workspaceId, onClose, onComplete }) => {
  /** * Explicitly cast initial state to the Record type to prevent narrow inference.
   * @type {[Record<string, KYCFile | null>, React.Dispatch<React.SetStateAction<Record<string, KYCFile | null>>>]} 
   */
  const [files, setFiles] = useState(
    /** @type {Record<string, KYCFile | null>} */ ({
      business_license: null,
      tax_id: null
    })
  );

  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Simulates a file upload process
   * @param {string} type - The document category (e.g., business_license)
   */
  const handleFileUpload = (type) => {
    /** @type {KYCFile} */
    const mockFile = {
      id: Math.random().toString(36).substr(2, 9),
      name: `${type === 'tax_id' ? 'TAX_FORM' : 'BIZ_LICENSE'}_2024.pdf`,
      size: 1024 * 1024 * 1.2,
      status: 'UPLOADING'
    };

    setFiles(prev => ({ ...prev, [type]: mockFile }));

    // Simulate network delay
    setTimeout(() => {
      setFiles(prev => {
        const currentFile = prev[type];
        if (!currentFile) return prev;
        
        return {
          ...prev,
          [type]: { ...currentFile, status: 'SUCCESS' }
        };
      });
    }, 1500);
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onComplete({ workspaceId, documents: files });
      setIsSubmitting(false);
    }, 2000);
  };

  const isFormValid = files.business_license?.status === 'SUCCESS' && files.tax_id?.status === 'SUCCESS';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg mx-auto bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-8 bg-slate-50 border-b border-slate-200 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <ShieldCheck size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Identity Verification</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">KYC Requirements</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Workspace: <span className="font-mono text-slate-700">{workspaceId}</span></p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <X size={20} className="text-slate-400" />
        </button>
      </div>

      <div className="p-8">
        {/* Warning Banner */}
        <div className="flex gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl mb-8">
          <AlertCircle className="text-amber-500 shrink-0" size={18} />
          <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
            Standard telecommunication laws require valid business documentation. Failure to verify within 24 hours will result in automatic DID suspension.
          </p>
        </div>

        {/* Upload Slots */}
        <div className="space-y-4 mb-8">
          {[
            { id: 'business_license', label: 'Business Incorporation License', icon: Building2 },
            { id: 'tax_id', label: 'Tax Identification (VAT/GST/EIN)', icon: Briefcase }
          ].map((doc) => {
            const file = files[doc.id];
            
            return (
              <div key={doc.id} className="group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">
                  {doc.label}
                </label>
                
                {!file ? (
                  <button 
                    type="button"
                    onClick={() => handleFileUpload(doc.id)}
                    className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-[1.5rem] hover:border-purple-400 hover:bg-purple-50 transition-all group/btn"
                  >
                    <Upload className="text-slate-300 group-hover/btn:text-purple-500 mb-2 transition-colors" size={24} />
                    <span className="text-xs font-bold text-slate-500 group-hover/btn:text-purple-600 transition-colors">Click to upload PDF</span>
                  </button>
                ) : (
                  <div className={`w-full flex items-center justify-between p-4 rounded-[1.5rem] border transition-all ${file.status === 'SUCCESS' ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200 animate-pulse'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${file.status === 'SUCCESS' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        <FileText size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{file.name}</p>
                        <p className="text-[10px] text-slate-500 italic">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                    </div>
                    {file.status === 'SUCCESS' ? (
                      <CheckCircle2 className="text-emerald-500" size={20} />
                    ) : (
                      <Loader2 className="animate-spin text-slate-400" size={20} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit Button */}
        <button 
          type="button"
          disabled={!isFormValid || isSubmitting}
          onClick={handleSubmit}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl shadow-slate-200"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={18} /> Validating...
            </>
          ) : (
            <>Submit Documents for Review</>
          )}
        </button>

        <div className="mt-6 flex items-start gap-2 p-3 bg-slate-50 rounded-xl">
          <Info size={14} className="text-slate-400 shrink-0 mt-0.5" />
          <p className="text-[9px] text-slate-500 leading-normal">
            Documents are reviewed by our compliance team within 2-4 business hours. You will receive an email notification once verified.
          </p>
        </div>
      </div>
    </div>
  );
};
import { useState } from 'react';

const API_BASE = 'https://l4fznwuful.execute-api.us-east-1.amazonaws.com/prod';

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

interface UploadModalProps {
  onClose: () => void;
  onUploadSuccess?: () => void;
}

export default function UploadModal({ onClose, onUploadSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const pickFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setState('idle');
    setErrorMsg('');
  };

  async function handleUpload() {
    if (!file) return;
    setState('uploading');
    setProgress(0);
    setErrorMsg('');

    try {
      // 1. Get presigned URL
      const res = await fetch(`${API_BASE}/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name }),
      });

      if (!res.ok) throw new Error(`Failed to get upload URL (${res.status})`);
      const { upload_url, content_type } = await res.json();

      // 2. PUT directly to S3 via presigned URL using XHR for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`S3 upload failed (${xhr.status})`)));
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.open('PUT', upload_url);
        xhr.setRequestHeader('Content-Type', content_type);
        xhr.send(file);
      });

      setState('done');
      onUploadSuccess?.();
    } catch (err: any) {
      setState('error');
      setErrorMsg(err.message ?? 'Upload failed');
    }
  }

  function handleClose() {
    if (preview) URL.revokeObjectURL(preview);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative z-10 w-full max-w-md bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="font-serif text-xl font-bold text-white">Upload a Moment</h2>
          <button onClick={handleClose} className="text-white/40 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {state !== 'done' ? (
            <>
              {/* Browse zone */}
              <label className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-colors min-h-[200px] overflow-hidden border-white/20 hover:border-white/40 bg-white/3">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="sr-only"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
                />
                {preview ? (
                  <img src={preview} alt="preview" className="w-full h-full object-cover max-h-56 pointer-events-none" />
                ) : (
                  <div className="flex flex-col items-center gap-3 py-10 px-4 text-center pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-white/8 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75 7.5 10.5l3 3L15 9l5.25 6.75M3.75 19.5h16.5M12 3v10.5" />
                      </svg>
                    </div>
                    <p className="text-sm text-white/50">Click to <span className="text-green-400">browse</span> an image</p>
                    <p className="text-xs text-white/25">JPG, JPEG, PNG, WEBG · max 10 MB</p>
                  </div>
                )}
              </label>

              {/* File info */}
              {file && state !== 'uploading' && (
                <p className="text-xs text-white/40 truncate text-center">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</p>
              )}

              {/* Progress bar */}
              {state === 'uploading' && (
                <div className="flex flex-col gap-1.5">
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-white/40 text-center">Uploading… {progress}%</p>
                </div>
              )}

              {/* Error */}
              {state === 'error' && (
                <p className="text-xs text-red-400 text-center">{errorMsg}</p>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 rounded-xl border border-white/15 text-sm text-white/60 hover:text-white hover:border-white/30 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file || state === 'uploading'}
                  className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 disabled:opacity-30 disabled:cursor-not-allowed text-black text-sm font-semibold transition-colors"
                >
                  {state === 'uploading' ? 'Uploading…' : 'Upload'}
                </button>
              </div>
            </>
          ) : (
            /* Success state */
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center">
                <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-lg">Moment uploaded!</p>
                <p className="text-white/40 text-sm mt-1">Your image is being processed — it'll appear in the gallery once AI captioning and moderation complete.</p>
              </div>
              <button
                onClick={handleClose}
                className="mt-2 px-6 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black text-sm font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
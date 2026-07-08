import { useRef, useState, useCallback } from 'react';
import { t } from '../../i18n';

/**
 * FileUpload — drag-and-drop + click-to-browse file picker.
 * Shows preview thumbnail after selection.
 */

export default function FileUpload({
  accept = 'image/jpeg,image/png',
  maxSizeMB = 10,
  onChange,
  label,
  hint,
  error,
  className = '',
}) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState(null);

  const maxBytes = maxSizeMB * 1024 * 1024;

  const handleFile = useCallback(
    (f) => {
      setFileError(null);

      if (!f) return;

      // Validate type
      const validTypes = accept.split(',').map((s) => s.trim());
      if (!validTypes.some((vt) => f.type.match(vt.replace('*', '.*')))) {
        setFileError(`Only ${validTypes.join(', ')} files are allowed.`);
        return;
      }

      // Validate size
      if (f.size > maxBytes) {
        setFileError(`File must be smaller than ${maxSizeMB} MB.`);
        return;
      }

      setFile(f);

      // Generate preview for images
      if (f.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target.result);
        reader.readAsDataURL(f);
      } else {
        setPreview(null);
      }

      onChange?.(f);
    },
    [accept, maxBytes, maxSizeMB, onChange]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragActive(false);
      const f = e.dataTransfer.files?.[0];
      handleFile(f);
    },
    [handleFile]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const handleClick = () => inputRef.current?.click();

  const handleChange = (e) => handleFile(e.target.files?.[0]);

  const removeFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    setFileError(null);
    if (inputRef.current) inputRef.current.value = '';
    onChange?.(null);
  };

  const displayError = error || fileError;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-text-primary">{label}</label>
      )}

      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        className={`
          relative flex flex-col items-center justify-center
          border-2 border-dashed rounded-lg
          min-h-[140px] p-4
          cursor-pointer
          transition-colors duration-150
          ${dragActive
            ? 'border-accent bg-accent-light'
            : displayError
              ? 'border-status-rejected bg-status-rejected-bg/30'
              : 'border-border-default hover:border-accent hover:bg-accent-light/50'
          }
        `}
      >
        {preview ? (
          <div className="relative w-full flex flex-col items-center gap-2">
            <img
              src={preview}
              alt="Preview"
              className="max-h-32 rounded-md object-contain"
            />
            <p className="text-xs text-text-secondary truncate max-w-full">
              {file?.name}
            </p>
            <button
              type="button"
              onClick={removeFile}
              className="absolute top-0 right-0 p-1 rounded-full bg-surface border border-border-default hover:bg-surface-alt text-text-secondary"
              aria-label="Remove file"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <>
            <svg className="w-8 h-8 text-text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm text-text-secondary text-center">
              Drag and drop or <span className="text-accent font-medium">browse</span>
            </p>
            <p className="text-xs text-text-muted mt-1">
              JPG or PNG, up to {maxSizeMB} MB
            </p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
          aria-label={label || 'Upload file'}
        />
      </div>

      {displayError && (
        <p className="text-xs text-status-rejected" role="alert">{displayError}</p>
      )}
      {!displayError && hint && (
        <p className="text-xs text-text-muted">{hint}</p>
      )}
    </div>
  );
}

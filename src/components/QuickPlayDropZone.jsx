import { useState, useCallback, useRef, useEffect } from 'react';
import { MonitorPlay, FolderOpen, FileVideo, ArrowRight } from 'lucide-react';
import { getRecentFiles } from '../utils/storage';
import { formatFileSize } from '../utils/formatFileSize';
import {
  supportsFileSystemAccess,
  VIDEO_PICKER_OPTIONS,
  saveFileHandle,
  openFileFromHandle,
} from '../utils/fileHandles';

const ACCEPTED_TYPES = ['.mp4', '.webm', '.mkv', '.mov'];
const ACCEPTED_MIME = ['video/mp4', 'video/webm', 'video/x-matroska', 'video/quicktime'];
const URL_PATTERN = /^https?:\/\/.+\.(mp4|webm|mkv|mov)(\?.*)?$/i;

function truncateName(name, max = 26) {
  if (name.length <= max) return name;
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';
  const base = name.slice(0, name.length - ext.length);
  const available = max - ext.length - 1;
  if (available <= 0) return name.slice(0, max - 1) + '…';
  return base.slice(0, available) + '…' + ext;
}

export default function QuickPlayDropZone({
  onFileSelect,
  onUrlSelect,
  compact,
  urlLoadError = '',
  onClearUrlError,
  showToast,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [recentFiles, setRecentFiles] = useState(() => getRecentFiles());
  const fileInputRef = useRef(null);
  const dragCountRef = useRef(0);

  const refreshRecent = useCallback(() => {
    setRecentFiles(getRecentFiles());
  }, []);

  useEffect(() => {
    refreshRecent();
  }, [refreshRecent]);

  useEffect(() => {
    if (urlLoadError) setError('');
  }, [urlLoadError]);

  const displayError = urlLoadError || error;

  const validateFile = useCallback((file) => {
    if (!file) return false;
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (ACCEPTED_TYPES.includes(ext) || ACCEPTED_MIME.includes(file.type)) {
      return true;
    }
    setError(`Unsupported format. Use ${ACCEPTED_TYPES.join(', ')}`);
    setTimeout(() => setError(''), 3000);
    return false;
  }, []);

  const validateUrl = useCallback((url) => {
    const trimmed = url.trim();
    if (!trimmed) return false;
    if (!URL_PATTERN.test(trimmed) && !trimmed.match(/\.(mp4|webm|mkv|mov)/i)) {
      setError('Enter a direct video URL (.mp4, .webm, .mkv, .mov)');
      setTimeout(() => setError(''), 3000);
      return false;
    }
    return true;
  }, []);

  const pickFileWithNativePicker = useCallback(async () => {
    if (!supportsFileSystemAccess()) {
      fileInputRef.current?.click();
      return;
    }
    try {
      const [handle] = await window.showOpenFilePicker(VIDEO_PICKER_OPTIONS);
      const file = await handle.getFile();
      if (!validateFile(file)) return;
      await saveFileHandle({ handle, name: file.name, size: file.size, lastOpened: Date.now() });
      onFileSelect(file, handle);
      refreshRecent();
    } catch (err) {
      if (err?.name === 'AbortError') return;
      if (err?.name === 'NotAllowedError') {
        showToast?.('Permission denied. Try opening the file again.');
        return;
      }
    }
  }, [onFileSelect, validateFile, refreshRecent, showToast]);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCountRef.current = 0;
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
        refreshRecent();
      }
    },
    [onFileSelect, validateFile, refreshRecent]
  );

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current += 1;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current -= 1;
    if (dragCountRef.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFileInput = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file && validateFile(file)) {
        onFileSelect(file);
        refreshRecent();
      }
      e.target.value = '';
    },
    [onFileSelect, validateFile, refreshRecent]
  );

  const handleUrlSubmit = useCallback(() => {
    const trimmed = urlInput.trim();
    onClearUrlError?.();
    if (validateUrl(trimmed)) {
      onUrlSelect(trimmed);
      setUrlInput('');
      refreshRecent();
    }
  }, [urlInput, onUrlSelect, validateUrl, refreshRecent, onClearUrlError]);

  const handleRecentClick = useCallback(
    async (recent) => {
      if (recent.url) {
        onClearUrlError?.();
        onUrlSelect(recent.url);
        refreshRecent();
        return;
      }
      if (supportsFileSystemAccess()) {
        const { file, denied, handle } = await openFileFromHandle(recent.name);
        if (denied) {
          showToast?.('Access to this file was denied.');
          await pickFileWithNativePicker();
          return;
        }
        if (file && validateFile(file)) {
          onFileSelect(file, handle);
          refreshRecent();
          return;
        }
        await pickFileWithNativePicker();
        return;
      }
      fileInputRef.current?.click();
    },
    [onUrlSelect, onFileSelect, validateFile, pickFileWithNativePicker, refreshRecent, showToast, onClearUrlError]
  );

  return (
    <div
      className={compact ? 'quick-play-compact' : 'quick-play'}
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
    >
      <div className="dropzone-layout">
        <div
          className={`dropzone-card${isDragging ? ' dropzone-card--dragging' : ''}`}
          onClick={pickFileWithNativePicker}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              pickFileWithNativePicker();
            }
          }}
        >
          <div className="dropzone-card__icon">
            <MonitorPlay size={40} color="#3a3a3a" strokeWidth={1.5} />
          </div>
          <p className="dropzone-card__title">Drop a video to start</p>
          <p className="dropzone-card__subtitle">MP4 · WebM · MKV · MOV</p>
          <span className="dropzone-card__browse">
            <FolderOpen size={14} color="currentColor" />
            Browse files
          </span>
        </div>

        <div className="divider-or">or</div>

        <input
          type="url"
          value={urlInput}
          onChange={(e) => {
            setUrlInput(e.target.value);
            if (urlLoadError) onClearUrlError?.();
          }}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlSubmit())}
          placeholder="Paste a direct video URL (.mp4, .webm...)"
          className="input-field"
        />

        {displayError && (
          <p className="text-error animate-fade-in" style={{ marginTop: 12 }}>
            {displayError}
          </p>
        )}

        {!compact && recentFiles.length > 0 && (
          <div className="recent-section">
            <p className="recent-label">Recent</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {recentFiles.map((recent) => (
                <button
                  key={`${recent.name}-${recent.openedAt}`}
                  type="button"
                  onClick={() => handleRecentClick(recent)}
                  className="recent-item"
                  title={recent.url ? recent.url : recent.name}
                >
                  <FileVideo size={16} color="var(--text-3)" />
                  <span className="recent-item__name">{truncateName(recent.name)}</span>
                  {recent.size > 0 && (
                    <span className="recent-item__size">{formatFileSize(recent.size)}</span>
                  )}
                  <ArrowRight size={14} className="recent-item__arrow" />
                </button>
              ))}
            </div>
          </div>
        )}

        {!supportsFileSystemAccess() && (
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp4,.webm,.mkv,.mov,video/*"
            className="hidden"
            onChange={handleFileInput}
            aria-label="Select video file"
          />
        )}
      </div>
    </div>
  );
}

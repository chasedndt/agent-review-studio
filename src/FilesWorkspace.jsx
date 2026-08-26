import { useEffect, useMemo, useState } from "react";
import { CheckCircleIcon } from "@phosphor-icons/react/CheckCircle";
import { DownloadSimpleIcon } from "@phosphor-icons/react/DownloadSimple";
import { FileArrowUpIcon } from "@phosphor-icons/react/FileArrowUp";
import { FileTextIcon } from "@phosphor-icons/react/FileText";
import { FolderOpenIcon } from "@phosphor-icons/react/FolderOpen";
import { LockIcon } from "@phosphor-icons/react/Lock";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/MagnifyingGlass";
import { WarningCircleIcon } from "@phosphor-icons/react/WarningCircle";
import { ARTIFACT_DEFINITIONS, formatBytes } from "./data.js";

const REVIEW_ORDER = new Map(ARTIFACT_DEFINITIONS.map((artifact, index) => [artifact.canonical, index]));

function useBlobUrl(file) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!file?.blob) {
      setUrl("");
      return undefined;
    }
    const next = URL.createObjectURL(file.blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
}

function downloadFile(file) {
  const blob = file.blob || new Blob([file.content || ""], { type: file.mime || "text/plain" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function ArtifactPreview({ file }) {
  const blobUrl = useBlobUrl(file);
  if (!file) return <div className="file-preview-empty"><FileTextIcon size={34} /><p>Select a file to inspect it.</p></div>;

  if (file.kind === "image") {
    return blobUrl
      ? <div className="media-preview"><img src={blobUrl} alt={`Imported evidence: ${file.name}`} /></div>
      : <div className="file-preview-empty"><p>This image is listed, but no local preview blob is available.</p></div>;
  }

  if (file.kind === "pdf") {
    return blobUrl
      ? <object className="pdf-preview" data={blobUrl} type="application/pdf" aria-label={`PDF preview for ${file.name}`}><p>PDF preview is unavailable. Download the file to inspect it.</p></object>
      : <div className="file-preview-empty"><p>This PDF is listed, but no local preview blob is available.</p></div>;
  }

  if ((file.extension === "csv" || file.extension === "tsv") && Array.isArray(file.parsed)) {
    const rows = file.parsed.slice(0, 40);
    return (
      <div className="table-preview" role="region" aria-label={`${file.name} table preview`} tabIndex="0">
        <table><tbody>{rows.map((row, rowIndex) => <tr key={`${file.id}-${rowIndex}`}>{row.map((cell, cellIndex) => rowIndex === 0 ? <th key={cellIndex}>{cell}</th> : <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table>
      </div>
    );
  }

  if (file.parsed !== null && file.parsed !== undefined) {
    return <pre className="artifact-code">{JSON.stringify(file.parsed, null, 2)}</pre>;
  }

  if (file.content) return <pre className="artifact-code text-preview">{file.content}</pre>;

  return (
    <div className="file-preview-empty">
      <LockIcon size={28} />
      <h3>Binary attachment retained</h3>
      <p>The browser stores this file locally with the run. Use Download copy to open it in its native tool.</p>
    </div>
  );
}

export function FilesWorkspace({ run, onImport, folderInputRef, fileInputRef }) {
  const files = run?.files || [];
  const [selectedId, setSelectedId] = useState(files[0]?.id || "");
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("all");

  useEffect(() => {
    setSelectedId(run?.files?.[0]?.id || "");
    setQuery("");
    setSection("all");
  }, [run?.id]);

  const sections = useMemo(() => Array.from(new Set(files.map((file) => file.section))).sort(), [files]);
  const visibleFiles = useMemo(() => files.filter((file) => {
    const matchesSection = section === "all" || file.section === section;
    const haystack = `${file.name} ${file.relativePath} ${file.roleLabel} ${file.format}`.toLowerCase();
    return matchesSection && haystack.includes(query.trim().toLowerCase());
  }).sort((left, right) => {
    const leftOrder = REVIEW_ORDER.get(left.canonical) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = REVIEW_ORDER.get(right.canonical) ?? Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder || left.relativePath.localeCompare(right.relativePath, undefined, { numeric: true });
  }), [files, query, section]);
  const selectedFile = visibleFiles.find((file) => file.id === selectedId) || visibleFiles[0] || null;
  const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);

  if (!run) {
    return (
      <section className="page-empty" data-tour="files-workspace">
        <FolderOpenIcon size={42} />
        <h1>No run selected</h1>
        <p>Choose a run from the left rail or import a folder to create a dated session.</p>
        <button className="primary-button" type="button" onClick={() => folderInputRef.current?.click()}><FileArrowUpIcon size={18} /> Import folder</button>
      </section>
    );
  }

  return (
    <section className="files-workspace" data-tour="files-workspace">
      <header className="page-header">
        <div>
          <p className="eyebrow">Complete run bundle</p>
          <h1>Files</h1>
          <p>{files.length} artifacts · {formatBytes(totalSize)} · Known contracts are mapped; everything else stays visible.</p>
        </div>
        <div className="page-actions">
          <button className="secondary-button" type="button" onClick={() => fileInputRef.current?.click()}><FileArrowUpIcon size={17} /> Import files</button>
          <button className="primary-button" type="button" onClick={() => folderInputRef.current?.click()}><FolderOpenIcon size={17} /> Import folder</button>
        </div>
      </header>

      <div className="file-browser">
        <aside className="file-list-panel">
          <div className="file-filters">
            <label className="search-field"><MagnifyingGlassIcon size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search files" aria-label="Search files" /></label>
            <select value={section} onChange={(event) => setSection(event.target.value)} aria-label="Filter files by section">
              <option value="all">All sections</option>
              {sections.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div className="file-list">
            {visibleFiles.map((file) => (
              <button type="button" key={file.id} className={file.id === selectedFile?.id ? "active" : ""} onClick={() => setSelectedId(file.id)}>
                <FileTextIcon size={18} />
                <span><strong>{file.name}</strong><small>{file.roleLabel} · {formatBytes(file.size)}</small></span>
                {file.parseError ? <WarningCircleIcon className="file-warning" size={16} /> : <CheckCircleIcon className="file-ok" size={16} />}
              </button>
            ))}
            {!visibleFiles.length && <p className="list-empty">No files match this filter.</p>}
          </div>
        </aside>

        <article className="file-preview-panel">
          {selectedFile && (
            <header>
              <div><p className="eyebrow">{selectedFile.section}</p><h2>{selectedFile.name}</h2><p>{selectedFile.relativePath}</p></div>
              <button className="secondary-button" type="button" onClick={() => downloadFile(selectedFile)}><DownloadSimpleIcon size={17} /> Download copy</button>
            </header>
          )}
          {selectedFile && (
            <dl className="file-metadata">
              <div><dt>Format</dt><dd>{selectedFile.format}</dd></div>
              <div><dt>Mapped role</dt><dd>{selectedFile.roleLabel}</dd></div>
              <div><dt>Parse status</dt><dd className={selectedFile.parseError ? "warning" : "success"}>{selectedFile.parseStatus}</dd></div>
              <div><dt>Size</dt><dd>{formatBytes(selectedFile.size)}</dd></div>
            </dl>
          )}
          {selectedFile?.parseError && <p className="parse-warning"><WarningCircleIcon size={17} /> {selectedFile.parseError}</p>}
          <ArtifactPreview file={selectedFile} />
        </article>
      </div>
    </section>
  );
}

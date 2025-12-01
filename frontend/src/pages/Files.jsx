import { useEffect, useState } from 'react';
import { Card, Button, Row, Col, Modal, Form, Alert, Table, Spinner } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import fileService from '../services/fileService';
import ConfirmModal from '../components/common/ConfirmModal';

const Files = () => {
  const { user } = useSelector((state) => state.auth);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });

  const canView = !!user?.permissions?.files?.view || user?.role === 'admin';
  const canUpload = !!user?.permissions?.files?.upload || user?.role === 'admin';
  const canDownload = !!user?.permissions?.files?.download || user?.role === 'admin';
  const canDelete = !!user?.permissions?.files?.delete || user?.role === 'admin';

  const loadFiles = async () => {
    try {
      setLoading(true);
      const data = await fileService.list();
      setFiles(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      loadFiles();
    }
  }, [canView]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      await fileService.upload(formData);
      setShowUpload(false);
      setSelectedFile(null);
      await loadFiles();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (id, originalName) => {
    try {
      const blob = await fileService.download(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName || 'downloaded_file';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Download failed');
    }
  };

  const handleDelete = async () => {
    try {
      await fileService.remove(confirmDelete.id);
      setConfirmDelete({ show: false, id: null });
      await loadFiles();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Delete failed');
    }
  };

  if (!canView) {
    return (
      <Alert variant="danger" className="mt-3">You do not have permission to view files.</Alert>
    );
  }

  return (
    <div className="files-page">
      <Row className="mb-4 align-items-center">
        <Col>
          <h1>Files</h1>
          <div className="text-muted">Upload, download and manage files</div>
        </Col>
        <Col xs="auto">
          {canUpload && (
            <Button variant="primary" onClick={() => setShowUpload(true)}>
              <i className="bi bi-cloud-upload me-2"></i>
              Upload File
            </Button>
          )}
        </Col>
      </Row>

      <Card>
        <Card.Body>
          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

          {loading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 120 }}>
              <Spinner animation="border" />
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Uploaded By</th>
                  <th>Uploaded At</th>
                  <th>Scan Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center text-muted">No files uploaded yet</td>
                  </tr>
                ) : (
                  files.map((f) => (
                    <tr key={f._id}>
                      <td>{f.originalName}</td>
                      <td>{f.mimetype}</td>
                      <td>{(f.size / 1024).toFixed(1)} KB</td>
                      <td>{f.uploadedBy?.name || '—'}</td>
                      <td>{new Date(f.createdAt).toLocaleString()}</td>
                      <td>
                        {f.scan?.status === 'infected' ? (
                          <span className="badge bg-danger">Infected</span>
                        ) : f.scan?.status === 'clean' ? (
                          <span className="badge bg-success">Clean</span>
                        ) : (
                          <span className="badge bg-secondary">Unknown</span>
                        )}
                      </td>
                      <td className="text-end">
                        {canDownload && (
                          <Button size="sm" variant="outline-secondary" className="me-2" onClick={() => handleDownload(f._id, f.originalName)}>
                            <i className="bi bi-download"></i>
                          </Button>
                        )}
                        {canDelete && (
                          <Button size="sm" variant="outline-danger" onClick={() => setConfirmDelete({ show: true, id: f._id })}>
                            <i className="bi bi-trash"></i>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Upload Modal */}
      <Modal show={showUpload} onHide={() => setShowUpload(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload File</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUpload}>
            <Form.Group controlId="fileInput" className="mb-3">
              <Form.Label>Select file</Form.Label>
              <Form.Control type="file" onChange={(e) => setSelectedFile(e.target.files[0])} />
              <Form.Text className="text-muted">Max 10MB; allowed types: PDF, DOCX, XLSX, PNG, JPG</Form.Text>
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowUpload(false)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={uploading || !selectedFile}>
                {uploading ? (<><Spinner as="span" animation="border" size="sm" className="me-2" />Uploading...</>) : 'Upload'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        show={confirmDelete.show}
        onHide={() => setConfirmDelete({ show: false, id: null })}
        onConfirm={handleDelete}
        title="Delete File"
        message="Are you sure you want to delete this file? This action cannot be undone."
      />
    </div>
  );
};

export default Files;
import api from './api';

const list = async () => {
  const res = await api.get('/files');
  return res.data;
};

const upload = async (formData) => {
  const res = await api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

const download = async (id) => {
  const res = await api.get(`/files/${id}/download`, { responseType: 'blob' });
  return res.data;
};

const remove = async (id) => {
  const res = await api.delete(`/files/${id}`);
  return res.data;
};

export default { list, upload, download, remove };
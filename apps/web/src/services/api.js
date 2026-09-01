import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
});

export const getDocuments = async () => {
  const response = await api.get('/documents');
  return response.data;
};

export const uploadDocument = async (formData) => {
  const response = await api.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const retryDocument = async (id) => {
  const response = await api.post(`/documents/${id}/retry`);
  return response.data;
};

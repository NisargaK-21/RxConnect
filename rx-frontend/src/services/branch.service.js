import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL;

export const getBranches = async (token) => {
  return axios.get(`${API}/branches`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const createBranch = async (data, token) => {
  return axios.post(`${API}/branches`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateBranch = async (id, data, token) => {
  return axios.put(`${API}/branches/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const deleteBranch = async (id, token) => {
  return axios.delete(`${API}/branches/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
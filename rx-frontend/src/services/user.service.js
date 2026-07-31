import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL;

export async function getStaff(token) {
  const res = await axios.get(`${API}/users/staff`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res;
}

export async function createStaff(data, token) {
  const res = await axios.post(
    `${API}/users/staff`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res;
}

export async function updateStaff(id, data, token) {
  const res = await axios.put(
    `${API}/users/staff/${id}`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res;
}

export async function deleteStaff(id, token) {
  const res = await axios.delete(
    `${API}/users/staff/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res;
}

export async function getProfile(token) {
  const res = await axios.get(
    `${API}/users/profile`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res;
}

export async function updateProfile(data, token) {
  const res = await axios.put(
    `${API}/users/profile`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res;
}
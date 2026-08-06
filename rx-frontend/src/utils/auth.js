export function saveAuth(data, user) {
  if (typeof data === "object" && data !== null && user === undefined) {
    localStorage.setItem("token", data.token || "");
    localStorage.setItem("user", JSON.stringify(data.user || {}));
    return;
  }

  localStorage.setItem("token", data || "");
  localStorage.setItem("user", JSON.stringify(user || {}));
}

export function getToken() {
  const token = localStorage.getItem("token");
  return token === "undefined" || token === "null" ? null : token;
}

export function getUser() {
  const user = localStorage.getItem("user");

  if (!user || user === "undefined" || user === "null") {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch (err) {
    console.error("Invalid user in localStorage:", user);
    localStorage.removeItem("user");
    return null;
  }
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
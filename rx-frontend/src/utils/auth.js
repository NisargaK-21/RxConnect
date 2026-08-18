export function saveAuth(data, user) {
  if (typeof window === "undefined") return;

  if (typeof data === "object" && data !== null && user === undefined) {
    localStorage.setItem("token", data.token || "");
    localStorage.setItem("user", JSON.stringify(data.user || {}));
    return;
  }

  localStorage.setItem("token", data || "");
  localStorage.setItem("user", JSON.stringify(user || {}));
}

export function getToken() {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  return token === "undefined" || token === "null" ? null : token;
}

export function getUser() {
  if (typeof window === "undefined") return null;
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
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
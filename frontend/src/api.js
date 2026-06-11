/** Backend base URL — set VITE_API_URL in production when frontend and API are on different hosts. */
export function getApiBaseUrl() {
  const configured = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (import.meta.env.DEV) return "";
  return window.location.origin;
}

const API_URL = getApiBaseUrl();

/** Turn relative API paths (e.g. /uploads/…) into absolute URLs when needed. */
export function resolveApiUrl(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function parseResponse(res) {
  const text = await res.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    const preview = text.replace(/\s+/g, " ").trim().slice(0, 120);
    const isHtml = preview.startsWith("<") || preview.includes("The page could not be found");

    if (isHtml) {
      throw new Error(
        import.meta.env.VITE_API_URL
          ? "Backend returned an HTML error page. Check that VITE_API_URL points to your live API."
          : "Backend not found. Deploy the API (see render.yaml) and set VITE_API_URL on Vercel, then redeploy."
      );
    }

    throw new Error(preview || `Request failed (${res.status})`);
  }
}

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await parseResponse(res);

  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

export { API_URL };

// Runtime configuration — edit this per environment instead of hardcoding
// the API URL inside script.js. In Kubernetes, this file can be mounted from
// a ConfigMap so the same frontend image works across dev/staging/prod.
window.APP_CONFIG = {
  // Default: same-origin "/api", which works when nginx (see nginx.conf) or an
  // Ingress routes /api/* to the backend service. For local dev without a
  // proxy in front, point this at the backend directly instead, e.g.:
  //   API_BASE_URL: "http://localhost:5000/api"
  API_BASE_URL: "/api"
};

// Utility to get the correct base URL for assets
export const getAssetUrl = (path) => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // In development (localhost), use the path as-is
  if (import.meta.env.DEV || window.location.hostname === 'localhost') {
    return `/${cleanPath}`;
  }
  
  // In production, prepend the base path
  const basePath = import.meta.env.PROD ? '/cis-110' : '';
  return `${basePath}/${cleanPath}`;
};

// Utility to get the base path for routing
export const getBasePath = () => {
  // In development (localhost), never use a base path
  if (import.meta.env.DEV || window.location.hostname === 'localhost') {
    return '';
  }
  // Only use base path in production
  return import.meta.env.PROD ? '/cis-110' : '';
};
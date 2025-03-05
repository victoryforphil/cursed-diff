/**
 * API client for the Cursed Diff application
 * 
 * This module handles API requests and ensures URLs are correct in both 
 * development and production environments.
 */

// In development, we use Vite's proxy feature to forward requests to the API server
// In production, the API is on the same origin as the static files
const API_BASE_URL = '/api';

/**
 * Function to get files from directory A
 */
export const getFilesA = async () => {
  const response = await fetch(`${API_BASE_URL}/files/a`);
  if (!response.ok) {
    throw new Error(`Failed to fetch files from directory A: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Function to get files from directory B
 */
export const getFilesB = async () => {
  const response = await fetch(`${API_BASE_URL}/files/b`);
  if (!response.ok) {
    throw new Error(`Failed to fetch files from directory B: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Function to get file contents from directory A
 * @param {number} fileIndex - Index of the file in the files array
 */
export const getFileAContents = async (fileIndex) => {
  const response = await fetch(`${API_BASE_URL}/files/a/${fileIndex}/contents`);
  if (!response.ok) {
    throw new Error(`Failed to fetch file contents from directory A: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Function to get file contents from directory B
 * @param {number} fileIndex - Index of the file in the files array
 */
export const getFileBContents = async (fileIndex) => {
  const response = await fetch(`${API_BASE_URL}/files/b/${fileIndex}/contents`);
  if (!response.ok) {
    throw new Error(`Failed to fetch file contents from directory B: ${response.statusText}`);
  }
  return response.json();
}; 
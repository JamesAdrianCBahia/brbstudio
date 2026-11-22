export class ApiError extends Error {
  constructor(message, status, fieldErrors = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export const getJson = (url) => request(url);

export const sendForm = (url, method, formData) => request(url, { method, body: formData });
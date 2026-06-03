export const isBrowserOffline = () =>
  typeof navigator !== 'undefined' && navigator.onLine === false;

export const isNetworkError = error =>
  error?.isOffline ||
  error?.code === 'ERR_NETWORK' ||
  error?.message === 'Network Error' ||
  (!error?.response && Boolean(error?.request));

export const getApiErrorMessage = error =>
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  error?.message ||
  'Request failed';

import { useState, useEffect } from 'react';

const useApi = (apiCall, deps = []) => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiCall();
        if (!cancelled) setData(res.data.data ?? res.data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Something went wrong');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, deps);

  return { data, loading, error };
};

export default useApi;

import { useState, useEffect } from "react";

const KEY = '8441cdee';

export function useMovies(query) {
    const [movies, setMovies] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState('');

    useEffect(() => {
        // callback?.();
    
    const controller = new AbortController();
    
    if (query.length < 5) {
      setMovies([]);
      setHasError('');
      return;
    }

    setIsLoading(true);
    setHasError('');
    // handleCloseMovie();
    
    fetch(`http://www.omdbapi.com/?apikey=${KEY}&s=${query}`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error('Something went wrong!');
        return res.json();
      })
      .then(data => {
        if (data.Response === 'False') throw new Error('Movie not found!');
        setMovies(data.Search);
        setHasError('');
      })
      .catch(err => {
        if (err.name !== 'AortError') setHasError(err.message);
      })
      .finally(setIsLoading(false));
    
    return function () { controller.abort(); }
    
    }, [query]);
    
    return { movies, isLoading, hasError };
}
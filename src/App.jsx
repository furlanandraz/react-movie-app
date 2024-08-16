import { useState, useEffect, useRef } from "react";
import StarRating from "./StarRating";
import { useMovies } from "./useMovies";
import { useLocalStorage } from "./useLocalStorage";
import { useKey } from "./useKey";

const KEY = '8441cdee';

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

export default function App() {
  
  // const [watched, setWatched] = useState([]);
  // const [watched, setWatched] = useState(function () {
  //   const storedValue = localStorage.getItem('watched');
  //   return JSON.parse(storedValue);
  // });
  const [query, setQuery] = useState('');
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const { movies, isLoading, hasError } = useMovies(query, handleCloseMovie);
  const [watched, setWatched] = useLocalStorage([], 'watched');

  function handleSelectMovie(id) {
    setSelectedMovieId(selectedMovieId => id === selectedMovieId ? null : id);
  }

  function handleCloseMovie() {
    setSelectedMovieId(null);

  }

   function handleAddWatch(movie) {
    setWatched(watched => [...watched, movie]);
  }

  function handleDelete(id) {
    setWatched(watched => watched.filter(movie => movie.imdbID !== id))
  }

  return (
    <>
      <Navbar>
        
        <Search query={query} setQuery={setQuery} />
        <NumResults movies={movies} />
      </Navbar>
      <Main>
        <ListBox>
          {isLoading && <Loader />}
          {!isLoading && !hasError && <MovieList movies={movies} onSelectMovie={handleSelectMovie} />}
          {hasError && <ErrorMessage message={hasError}/>}
        </ListBox>
        <WatchedBox
          selectedMovieId={selectedMovieId}
          onCloseMovie={handleCloseMovie}
          watched={watched}
          onAddWatched={handleAddWatch}
          onDelete={handleDelete} />
      </Main>
    </>
  );
}



function Loader() {
  return (
    <div className="loader">Loading...</div>
  )
}

function ErrorMessage({message}) {
  return (
    <div className="error">{message}</div>
  )
}

function Navbar({children}) {
  return (
    <nav className="nav-bar">
      <Logo />
      {children}
    </nav>
  );
}

function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>usePopcorn</h1>
    </div>
  );
}

function NumResults({ movies }) {
  const moviesFound = movies.length;
  return (
    <p className="num-results">
        Found <strong>{moviesFound}</strong> results
      </p>
  )
}

function Search({ query, setQuery }) {
  const inputElement = useRef(null);

  useKey('Enter', function () {
    if (document.activeElement === inputElement) return;
    inputElement.current.focus();
    setQuery('');
  });

  // useEffect(() => {
  //   function callback(event) {
  //     if (document.activeElement === inputElement) return;
  //     if (event.code === 'Enter') {
  //       inputElement.current.focus();
  //       setQuery('');
  //     }
  //   }
  //   document.addEventListener('keydown', callback);
  //   return () => document.removeEventListener('keydown', callback)
    
  // }, [setQuery]);

  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      ref={inputElement}
    />
  );
}

function Main({children}) {
  return (
    <main className="main">
      {children}   
    </main>
  );
}

function ListBox({children}) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="box">
      <BoxToggleButton isOpen={isOpen} onSetOpen={setIsOpen} />
        {isOpen && children}
      </div>
  )
}

function BoxToggleButton({isOpen, onSetOpen}) {
  return (
    <button
      className="btn-toggle"
      onClick={() => onSetOpen(open => !open)}>
      {isOpen ? "-" : "+"}
    </button>
  );
}

function MovieDetails({ selectedMovieId, onCloseMovie, onAddWatched, watched }) {
  const [movie, setMovie] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState('');

  const isWatched = watched.map(movie => movie.imdbID).includes(selectedMovieId);
  const watchedUserRating = watched.find(movie => movie.imdbID === selectedMovieId)?.userRating;

  useKey('Escape', onCloseMovie);

  const {
    Title: title,
    Year: year,
    Poster: poster,
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre,
  } = movie;

  useEffect(() => {
    async function getMovieDetails() {
      setIsLoading(true);
      const res = await fetch(`http://www.omdbapi.com/?apikey=${KEY}&i=${selectedMovieId}`);
      const data = await res.json();
      setMovie(data);
      setIsLoading(false);
    }
    getMovieDetails();
  }, [selectedMovieId]);

  function handleAdd() {
    const newWatchedMovie = {
      imdbID: selectedMovieId,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(' ').at(0)),
      userRating,
    }
    onAddWatched(newWatchedMovie);
    onCloseMovie();
  }
 
  useEffect(function () {
    if (!title) return;
    document.title = `Movie | ${title}`;
    return function() {
      document.title = 'usePopcorn';
    }
  }, [title]);

  return (
    <div className="details">
      {isLoading ? <Loader /> :
        <>
          <header>
            <button className="btn-back" onClick={onCloseMovie}>&larr;</button>
            <img src={poster} alt={`Poster of ${movie} movie`} />
            <div className="details-overview">
              <h2>{title}</h2>
              <p>{released} &bull; {runtime}</p>
              <p>{genre}</p>
              <p><span>⭐</span>{imdbRating} IMDB rating</p>
            </div>
          </header>
          <section>
            <div className="rating">
              {!isWatched ? <>
                <StarRating maxRating={10} size={24} onSetRating={setUserRating} /> 
                {userRating > 0 && <button className="btn-add" onClick={handleAdd}>Add to list</button>}
              </> : <p>You rated this movie {watchedUserRating} <span>⭐</span></p>}
            </div>
            <p><em>{plot}</em></p>
            <p>Starring {actors}</p>
            <p>Director {director}</p>
          </section>
        </>}
    </div>
  );
}

function Movie({movie, onSelectMovie}) {
  return (
    <li className="pointer" onClick={() => onSelectMovie(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}

function MovieList({movies, onSelectMovie}) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movie movie={movie} onSelectMovie={onSelectMovie}  key={movie.imdbID}/>
      ))}
    </ul>
  );
}

function WatchedBox({selectedMovieId, onCloseMovie, onAddWatched, watched, onDelete}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="box">
      <BoxToggleButton isOpen={isOpen} onSetOpen={setIsOpen} />      
      {isOpen && (
        selectedMovieId ? <MovieDetails selectedMovieId={selectedMovieId} onCloseMovie={onCloseMovie} onAddWatched={onAddWatched} watched={watched} /> :
        <>
          <WatchedSummary watched={watched} />
            <WatchedList watched={watched} onDelete={onDelete} />
        </>
      )}
    </div>
  );
}

function WatchedSummary({watched}) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));

  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating.toFixed(1)}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating.toFixed(1)}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime} min</span>
        </p>
      </div>
    </div>
  );
}

function WatchedList({ watched, onDelete }) {
  return (
    <ul className="list">
      {watched.map((movie) => (
        <WatchedItem movie={movie} key={movie.imdbID} onDelete={onDelete} />
      ))}
    </ul>
  );
}

function WatchedItem({movie, onDelete}) {
  return (
    <li>
      <img src={movie.poster} alt={`${movie.title} poster`} />
      <h3>{movie.title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runtime} min</span>
        </p>
        <button className="btn-delete" onClick={()=>onDelete(movie.imdbID)}>X</button>
      </div>
    </li>
  );
}
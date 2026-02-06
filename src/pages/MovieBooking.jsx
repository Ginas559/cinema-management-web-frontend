import React, { useState, useEffect, useMemo } from "react";
import { useMovies } from "../hooks/useMovies";
import { useSearch } from "../hooks/useSearch";
import "../styles/movie-booking.css";
import { useNavigate } from "react-router-dom";

const postersImport = require.context(
  "../assets/images/posters",
  false,
  /\.(png|jpe?g|svg)$/
);

const posters = {};
postersImport.keys().forEach((key) => {
  const fileName = key.replace("./", "");
  posters[fileName] = postersImport(key);
});

export function MovieBooking() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedAge, setSelectedAge] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [useSemanticSearch, setUseSemanticSearch] = useState(false);

  const { movies, fetchAllMovies, loading: moviesLoading, error: moviesError } = useMovies();
  const { 
    searchResults, 
    expandedTokens,
    loading: searchLoading, 
    error: searchError, 
    search, 
    expand,
    clearSearch 
  } = useSearch();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllMovies();
  }, []);

  // Trigger semantic search with debounce
  useEffect(() => {
    if (!useSemanticSearch || !searchTerm.trim()) {
      clearSearch();
      return;
    }

    const timeoutId = setTimeout(() => {
      search(searchTerm, 20);
      expand(searchTerm); // Also get expanded tokens
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, useSemanticSearch, search, expand, clearSearch]);

  const handleBooking = (movieId) => {
    if (localStorage.getItem("role") === "CUSTOMER") {
      navigate(`/booking/${movieId}`);      
    } else {
      navigate(`/pos/${movieId}`);  
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
  };
  
  const movieList = Array.isArray(movies) ? movies : [];

  // Filter movies based on search results or standard filters
  const filteredMovies = useMemo(() => {
    let moviesToFilter = movieList;

    // If semantic search is enabled and we have results
    if (useSemanticSearch && searchResults.length > 0) {
      const searchTitles = searchResults.map(r => r.title.toLowerCase());
      moviesToFilter = movieList.filter(movie => 
        searchTitles.includes(movie.title.toLowerCase())
      );
      
      // Sort by search score
      moviesToFilter.sort((a, b) => {
        const aIndex = searchTitles.indexOf(a.title.toLowerCase());
        const bIndex = searchTitles.indexOf(b.title.toLowerCase());
        return aIndex - bIndex;
      });
    } else if (!useSemanticSearch && searchTerm) {
      // Standard text search
      moviesToFilter = movieList.filter(movie =>
        movie.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply other filters
    return moviesToFilter.filter((movie) => {
      const matchGenre =
        selectedGenre === "all" ||
        (movie.genres &&
          movie.genres.some(
            (g) => g.toLowerCase() === selectedGenre.toLowerCase()
          ));

      const matchAge =
        selectedAge === "all" ||
        movie.ageRating?.toLowerCase() === selectedAge.toLowerCase();

      const matchLanguage =
        selectedLanguage === "all" ||
        (movie.languages &&
          movie.languages.some(
            (lang) => lang.toLowerCase() === selectedLanguage.toLowerCase()
          ));

      return matchGenre && matchAge && matchLanguage;
    });
  }, [movieList, searchTerm, searchResults, useSemanticSearch, selectedGenre, selectedAge, selectedLanguage]);

  const getCurrentDate = () => {
    const now = new Date();
    return now.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const loading = moviesLoading || (useSemanticSearch && searchLoading);
  const error = moviesError || searchError;

  return (
    <div className="movie-booking">
      {/* Header */}
      <header className="movie-booking-header">
        <div className="movie-booking-date-section">
          <div className="movie-booking-calendar-icon">📅</div>
          <span>{getCurrentDate()}</span>
          <span>{getCurrentTime()}</span>
        </div>
        <h1 className="movie-booking-title">Movies</h1>
        <nav className="movie-booking-nav-buttons">
          <button className="movie-booking-nav-button">Showtime</button>
          <button className="movie-booking-nav-button active">Movie</button>
        </nav>
      </header>

      {/* Filters */}
      <section className="movie-booking-filters-section">
        <div className="movie-booking-search-box">
          <span className="movie-booking-search-icon">🔍</span>
          <input
            type="text"
            placeholder={useSemanticSearch ? "Semantic Search (e.g., 'action thriller')" : "Search"}
            className="movie-booking-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <label className="movie-booking-semantic-toggle">
            <input
              type="checkbox"
              checked={useSemanticSearch}
              onChange={(e) => {
                setUseSemanticSearch(e.target.checked);
                if (!e.target.checked) {
                  clearSearch();
                }
              }}
            />
            Semantic Search
          </label>
        </div>

        <div className="movie-booking-filter-group">
          <label>Genre</label>
          <select
            className="movie-booking-filter-select"
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
          >
            <option value="all">All</option>
            <option value="ACTION">Action</option>
            <option value="ADVENTURE">Adventure</option>
            <option value="ANIMATION">Animation</option>
            <option value="COMEDY">Comedy</option>
            <option value="CRIME">Crime</option>
            <option value="DRAMA">Drama</option>
            <option value="FANTASY">Fantasy</option>
            <option value="HORROR">Horror</option>
            <option value="MUSICAL">Musical</option>
            <option value="ROMANCE">Romance</option>
            <option value="SCI_FI">Sci-Fi</option>
            <option value="THRILLER">Thriller</option>
            <option value="WAR">War</option>
            <option value="WESTERN">Western</option>
          </select>
        </div>

        <div className="movie-booking-filter-group">
          <label>Age</label>
          <select
            className="movie-booking-filter-select"
            value={selectedAge}
            onChange={(e) => setSelectedAge(e.target.value)}
          >
            <option value="all">All</option>
            <option value="P">P</option>
            <option value="K">K</option>
            <option value="T13">T13</option>
            <option value="T16">T16</option>
            <option value="T18">T18</option>
            <option value="C">C</option>
          </select>
        </div>

        <div className="movie-booking-filter-group">
          <label>Language</label>
          <select
            className="movie-booking-filter-select"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
          >
            <option value="all">All</option>
            <option value="EN">English</option>
            <option value="VI">Vietnamese</option>
          </select>
        </div>
      </section>

      {/* Search Suggestions */}
      {useSemanticSearch && searchTerm && expandedTokens.length > 0 && (
        <div className="movie-booking-suggestions-container">
          <div className="movie-booking-suggestions-title">
            Search suggestions based on "{searchTerm}"
          </div>
          <div className="movie-booking-suggestions-list">
            {expandedTokens.map((token, index) => (
              <button
                key={index}
                className="movie-booking-suggestion-chip"
                onClick={() => handleSuggestionClick(token)}
              >
                {token}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Info */}
      {useSemanticSearch && searchTerm && searchResults.length > 0 && (
        <div className="movie-booking-search-info">
          <p>
            Found <strong>{searchResults.length}</strong> semantic matches for "<strong>{searchTerm}</strong>"
          </p>
        </div>
      )}

      {/* Movies Grid */}
      <section className="movie-booking-movies-grid">
        {loading && <p className="movie-booking-loading">Loading movies...</p>}
        {error && <p className="movie-booking-error">{error}</p>}
        {!loading && filteredMovies.length === 0 && (
          <p className="movie-booking-no-results">No movies found.</p>
        )}

        {filteredMovies.map((movie) => {
          const fileName = movie.posterUrl
            ? movie.posterUrl.split("/").pop()
            : null;
          const posterSrc =
            (fileName && posters[fileName]) || movie.posterUrl || "/fallback.jpg";

          // Find search score if using semantic search
          const searchResult = useSemanticSearch 
            ? searchResults.find(r => r.title.toLowerCase() === movie.title.toLowerCase())
            : null;

          return (
            <div key={movie.movieId} className="movie-booking-movie-card">
              {searchResult && (
                <div className="movie-booking-match-score">
                  {(searchResult.score * 100).toFixed(1)}%
                </div>
              )}
              <img
                src={posterSrc}
                alt={movie.title}
                className="movie-booking-movie-poster"
              />
              <h3 className="movie-booking-movie-title">{movie.title}</h3>
              <div className="movie-booking-movie-details">
                <div className="movie-booking-duration">
                  <span className="movie-booking-clock-icon">🕐</span>
                  {movie.duration} min
                </div>
                <div className="movie-booking-rating">
                  {movie.rating === 0 ? "Upcoming" : movie.rating.toFixed(2)}
                </div>
              </div>

              {movie.languages && movie.languages.length > 0 && (
                <div className="movie-booking-languages">
                  Languages: {movie.languages.join(", ")}
                </div>
              )}

              <button
                className="movie-booking-button"
                onClick={() => handleBooking(movie.movieId)}
              >
                Booking
              </button>
            </div>
          );
        })}
      </section>
    </div>
  );
}
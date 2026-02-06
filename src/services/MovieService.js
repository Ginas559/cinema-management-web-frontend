import api from "./api";

export async function getAllMovies() {
    const res = await api.get("/api/movies");
    return res.data;
}

export async function getMovieById(movieId) {
    const res = await api.get(`/api/movies/${movieId}`);
    return res.data;
}

export async function getHotMovies() {
    const res = await api.get("/api/movies/hot");
    return res.data;
}

export async function getUpcomingMovies() {
    const res = await api.get("/api/movies/upcoming");
    return res.data;
}

export async function createMovie(movieData, posterFile) {
    const formData = new FormData();
    
    const movieBlob = new Blob([JSON.stringify(movieData)], { 
        type: 'application/json' 
    });
    formData.append('movie', movieBlob);
    
    if (posterFile) {
        formData.append('poster', posterFile);
    }
    
    const res = await api.post("/api/movies", formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return res.data;
}

export async function updateMovie(movieId, movieData = null, posterFile = null) {
    const formData = new FormData();
    
    if (movieData) {
        const movieBlob = new Blob([JSON.stringify(movieData)], { 
            type: 'application/json' 
        });
        formData.append('movie', movieBlob);
    }

    if (posterFile) {
        formData.append('poster', posterFile);
    }
    
    const res = await api.put(`/api/movies/${movieId}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return res.data;
}

export async function deleteMovie(movieId) {
    const res = await api.delete(`/api/movies/${movieId}`);
    return res.data;
}
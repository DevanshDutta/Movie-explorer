// index.js

require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const app = express();
const prisma = new PrismaClient();

const PORT = 3000;

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// TMDB fetching functions
async function fetchMoviesFromTMDB(page = 1) {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
      params: { api_key: TMDB_API_KEY, language: 'en-US', page }
    });
    return response.data.results;
  } catch (error) {
    console.error('TMDB fetch failed:', error.message);
    return [];
  }
}

async function fetchCastFromTMDB(movieId) {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}/credits`, {
      params: { api_key: TMDB_API_KEY }
    });
    return response.data.cast;
  } catch (error) {
    console.error(`Failed to fetch cast for movie ${movieId}:`, error.message);
    return [];
  }
}

// Seed function to fetch from TMDB and save in database
async function seedMoviesAndCast() {
  const movies = await fetchMoviesFromTMDB(1); // You can loop for more pages if needed
  for (const movie of movies) {
    // Upsert Movie
    await prisma.movie.upsert({
      where: { id: movie.id },
      update: {},
      create: {
        id: movie.id,
        title: movie.title,
        overview: movie.overview,
        voteAverage: movie.vote_average,
        voteCount: movie.vote_count,
        releaseDate: movie.release_date ? new Date(movie.release_date) : null,
        posterPath: movie.poster_path,
      }
    });

    // Upsert Genres
    if (movie.genre_ids && movie.genre_ids.length > 0) {
      for (const genreId of movie.genre_ids) {
        await prisma.genre.upsert({
          where: { id: genreId },
          update: {},
          create: { id: genreId, name: `Genre ${genreId}` }
        });
        await prisma.movieGenre.upsert({
          where: { movieId_genreId: { movieId: movie.id, genreId } },
          update: {},
          create: {
            movieId: movie.id,
            genreId,
          }
        });
      }
    }

    // Upsert Cast (top 10 cast members to limit volume)
    const castList = await fetchCastFromTMDB(movie.id);
    for (const castMember of castList.slice(0, 10)) {
      await prisma.cast.upsert({
        where: { id: castMember.id },
        update: {},
        create: {
          id: castMember.id,
          name: castMember.name,
          gender: castMember.gender,
          profilePath: castMember.profile_path,
          popularity: castMember.popularity,
        }
      });
      await prisma.movieCast.upsert({
        where: { movieId_castId: { movieId: movie.id, castId: castMember.id } },
        update: {},
        create: {
          movieId: movie.id,
          castId: castMember.id,
          character: castMember.character,
          order: castMember.order,
        }
      });
    }
  }
}

// API endpoint to get movies with optional filtering, sorting, pagination, and search
app.get('/movies', async (req, res) => {
  try {
    const {
      year,
      genres,
      sort,
      search,
      page = 1,
      pageSize = 10
    } = req.query;

    const where = {};

    if (year) {
      const y = parseInt(year);
      where.releaseDate = {
        gte: new Date(`${y}-01-01`),
        lte: new Date(`${y}-12-31`)
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        {
          casts: {
            some: {
              cast: { name: { contains: search } }
            }
          }
        }
      ];
    }

    if (genres) {
      const genreList = genres.split(',').map(g => g.trim());
      where.genres = {
        some: {
          genre: {
            name: { in: genreList }
          }
        }
      };
    }

    let orderBy = { voteAverage: 'desc' };
    if (sort) {
      switch (sort) {
        case 'popularity_asc':
          orderBy = { voteCount: 'asc' };
          break;
        case 'popularity_desc':
          orderBy = { voteCount: 'desc' };
          break;
        case 'release_asc':
          orderBy = { releaseDate: 'asc' };
          break;
        case 'release_desc':
          orderBy = { releaseDate: 'desc' };
          break;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);

    const movies = await prisma.movie.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        genres: { include: { genre: true } },
        casts: { include: { cast: true } }
      }
    });

    res.json(movies);
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Uncomment below line to seed the database ONCE, then comment/remove it after seeding
seedMoviesAndCast().catch(console.error);

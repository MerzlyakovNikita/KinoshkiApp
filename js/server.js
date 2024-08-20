const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const port = process.env.PORT || 3006;

app.use(cors());
app.use('/posters', express.static('posters'));

// Настройка подключения к базе данных
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'poiuytrewq09',
  database: 'kinoshki'
});

db.connect(err => {
  if (err) {
      console.error('Ошибка подключения к базе данных:', err);
      return;
  }
  console.log('Успешно подключено к базе данных MySQL!');
});

// Получение фильмов по критериям
app.get('/movies', (req, res) => {
  const genre = req.query.genre;
  const releaseYearStart = req.query.releaseYearStart;
  const releaseYearEnd = req.query.releaseYearEnd;
  const ratingStart = req.query.ratingStart;
  const ratingEnd = req.query.ratingEnd;
  const limit = parseInt(req.query.limit) || 20;
  const page = parseInt(req.query.page) || 1;
  const sort = req.query.sort;

  const offset = (page - 1) * limit;

  let query = `
    SELECT movies.*, AVG(reviews.rating) as averageRating 
    FROM movies 
    LEFT JOIN reviews ON movies.id = reviews.movie_id 
    WHERE 1=1
  `
  let countQuery = 'SELECT COUNT(*) AS count FROM movies WHERE 1=1';
  const queryParams = [];
  const countParams = [];

  if (genre) {
    query += ' AND genres LIKE ?';
    countQuery += ' AND genres LIKE ?';
    queryParams.push(`%${genre}%`);
    countParams.push(`%${genre}%`);
  }

  if (releaseYearStart && releaseYearEnd) {
    query += ' AND year BETWEEN ? AND ?';
    countQuery += ' AND year BETWEEN ? AND ?';
    queryParams.push(releaseYearStart, releaseYearEnd);
    countParams.push(releaseYearStart, releaseYearEnd);
  }

  if (ratingStart && ratingEnd) {
    query += ' AND movies.rating BETWEEN ? AND ?';
    countQuery += ' AND movies.rating BETWEEN ? AND ?';
    queryParams.push(ratingStart, ratingEnd);
    countParams.push(ratingStart, ratingEnd);
  }

  query += ' GROUP BY movies.id';
  
  if (sort) {
    switch(sort) {
      case 'byRating':
        query += ' ORDER BY rating DESC';
        break;
      case 'byReleaseYear':
        query += ' ORDER BY year DESC';
        break;
      case 'byTitle':
        query += ' ORDER BY name ASC';
        break;
      default:
        query += ' ORDER BY id ASC';
    }
  } else {
    query += ' ORDER BY top250 ASC';
  }
  
  query += ' LIMIT ? OFFSET ?';
  queryParams.push(limit, offset);

  db.query(countQuery, countParams, (err, countResult) => {
    if (err) {
      console.error('Ошибка выполнения запроса к базе данных:', err);
      res.status(500).send('Ошибка выполнения запроса к базе данных');
      return;
    }

    const totalMovies = countResult[0].count;
    const totalPages = Math.ceil(totalMovies / limit);

    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error('Ошибка выполнения запроса к базе данных:', err);
        res.status(500).send('Ошибка выполнения запроса к базе данных');
        return;
      }
      res.json({ movies: results, totalPages });
    });
  });
});

// Сохранение отзыва в БД
app.post('/reviews', (req, res) => {
  const { movieId, rating, reviewText } = req.body;
  const sql = 'INSERT INTO reviews (movie_id, rating, review_text) VALUES (?, ?, ?)';
  db.query(sql, [movieId, rating, reviewText], (err, result) => {
      if (err) {
          console.error('Ошибка сохранения отзыва:', err);
          res.status(500).send('Ошибка сохранения отзыва');
      } else {
          res.status(200).send('Отзыв успешно оставлен');
      }
  });
});

// Получение отзывов о фильме
app.get('/reviews/:movieId', (req, res) => {
  const movieId = req.params.movieId;
  const sql = 'SELECT * FROM reviews WHERE movie_id = ? ORDER BY created_at DESC LIMIT 10';
  db.query(sql, [movieId], (err, results) => {
      if (err) {
          console.error('Ошибка получения отзывов:', err);
          res.status(500).send('Ошибка получения отзывов');
      } else {
          res.json(results);
      }
  });
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
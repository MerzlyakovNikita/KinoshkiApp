document.addEventListener("DOMContentLoaded", function() {
    const sidebar = document.getElementById('sidebar');
    const sidebarContent = document.querySelector('.sidebar-content');
    const genreSelect = document.getElementById('genre');
    const sortSelect = document.getElementById('sort');
    const modal = document.getElementById('modal');
    const modalContent = document.querySelector('.modal-content');
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    const pageNumbers = document.querySelector('.page-numbers');

    const moviesURL = 'http://localhost:3006/movies';
    const reviewsURL = 'http://localhost:3006/reviews';
    let currentPage = 1;
    const limit = 20;
    let totalPages = 1;

    // Инициализация noUiSlider для диапазона оценок
    const ratingSlider = document.getElementById('rating-slider');
    const ratingMinValue = document.getElementById('rating-min-value');
    const ratingMaxValue = document.getElementById('rating-max-value');

    noUiSlider.create(ratingSlider, {
        start: [0, 10],
        connect: true,
        range: {
            'min': 0,
            'max': 10
        }
    });

    // Обновление значений на странице при изменении ползунка оценки
    ratingSlider.noUiSlider.on('update', function(values, handle) {
        const value = parseFloat(values[handle]).toFixed(1);
        if (handle === 0) {
            ratingMinValue.textContent = value;
        } else {
            ratingMaxValue.textContent = value;
        }
    });

    // Инициализация noUiSlider для диапазона годов выхода
    const releaseYearSlider = document.getElementById('release-year-slider');
    const releaseYearMinValue = document.getElementById('release-year-min-value');
    const releaseYearMaxValue = document.getElementById('release-year-max-value');

    noUiSlider.create(releaseYearSlider, {
        start: [2000 , 2024],
        connect: true,
        step: 1,
        range: {
            'min': 2000,
            'max': 2024
        },
        format: {
            to: function(value) {
                return Math.round(value);
            },
            from: function(value) {
                return value;
            }
        }
    });

    // Обновление значений на странице при изменении ползунка годов релиза
    releaseYearSlider.noUiSlider.on('update', function(values, handle) {
        const value = Math.round(values[handle]);
        if (handle === 0) {
            releaseYearMinValue.textContent = value;
        } else {
            releaseYearMaxValue.textContent = value;
        }
    });

    function setRatingColor(rating) {
        if (rating >= 7) {
            return 'green';
        } else if (rating >= 4) {
            return 'orange';
        } else {
            return 'red';
        }
    }

    function fetchMovies(page = 1) {
        const selectedGenre = genreSelect.value;
        const releaseYearRange = releaseYearSlider.noUiSlider.get();
        const ratingRange = ratingSlider.noUiSlider.get();
        const selectedSort = sortSelect.value;

        let url = `${moviesURL}?limit=${limit}&page=${page}`;

        if (selectedGenre) {
            url += `&genre=${encodeURIComponent(selectedGenre)}`;
        }

        if (releaseYearRange) {
            url += `&releaseYearStart=${releaseYearRange[0]}&releaseYearEnd=${releaseYearRange[1]}`;
        }

        if (ratingRange) {
            url += `&ratingStart=${ratingRange[0]}&ratingEnd=${ratingRange[1]}`;
        }

        if (selectedSort) {
            url += `&sort=${encodeURIComponent(selectedSort)}`;
        }

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const container = document.querySelector('.container');
                container.innerHTML = '';

                totalPages = data.totalPages;

                data.movies.forEach(movie => {
                    const movieCard = document.createElement('div');
                    movieCard.classList.add('movie-card');
                    movieCard.dataset.id = movie.id;

                    const posterPath = `/posters/${movie.id}.jpg`;

                    let averageRating = '--';
                    if (movie.averageRating == 10) {
                        averageRating = parseFloat(movie.averageRating).toFixed(0);
                    }
                    else {
                        if (movie.averageRating !== null && !isNaN(movie.averageRating)) {
                            averageRating = parseFloat(movie.averageRating).toFixed(1);
                        }
                    }

                    movieCard.innerHTML = `
                        <img class="movie-poster" src="${posterPath}" alt="${movie.name}">
                        <div class="movie-info">
                            <div class="movie-title">${movie.name}</div>
                            <div class="year-genre">${movie.year} <span class="separator">|</span> ${movie.genres}</div>
                            <div class="movie-short-description">${movie.shortDescription}</div>
                            <div class="ratings-container">
                                <div class="rating-pair">
                                    <div class="movie-rating" style="border: 2px solid ${setRatingColor(movie.rating)}">
                                        ${movie.rating}
                                    </div>
                                    <div class="rating-source">КиноПоиск</div>
                                </div>
                                <div class="rating-pair">
                                    <div class="movie-rating" style="border: 2px solid ${setRatingColor(averageRating)}">
                                        ${averageRating}
                                    </div>
                                    <div class="rating-source">Kinoshki</div>
                                </div>
                            </div>
                            <button class="btn" movie-title="${movie.name}">Отзывы</button>
                        </div>
                    `;
                    container.appendChild(movieCard);

                    //Отображение боковой панели при нажатии на постер
                    const poster = movieCard.querySelector('.movie-poster');
                    poster.addEventListener('click', () => { showSidebar(movie, posterPath); });

                    const reviewsButton = movieCard.querySelector('.btn');
                    const movieTitle = reviewsButton.getAttribute('movie-title');
                    reviewsButton.addEventListener('click', () => { showReviewModal(movieTitle, movie.id); });
                });

                updatePaginationControls();
            })
            .catch(error => console.error('Ошибка при загрузке фильмов:', error));
    }

    // Пагинация
    function updatePaginationControls() {
        pageNumbers.innerHTML = '';

        if (currentPage <= 1) {
            prevButton.disabled = true;
        } else {
            prevButton.disabled = false;
        }

        if (currentPage >= totalPages) {
            nextButton.disabled = true;
        } else {
            nextButton.disabled = false;
        }

        if (totalPages <= 1) {
            return;
        }

        const createPageButton = (page) => {
            const pageButton = document.createElement('span');
            pageButton.classList.add('page-number');
            pageButton.textContent = page;
            if (page === currentPage) {
                pageButton.classList.add('current');
            }
            pageButton.addEventListener('click', () => {
                currentPage = page;
                fetchMovies(currentPage);
            });
            return pageButton;
        };

        // Первая страница
        if (currentPage > 2) {
            pageNumbers.appendChild(createPageButton(1));
        }

        // Многоточие левое
        if (currentPage > 3) {
            pageNumbers.appendChild(document.createElement('span')).classList.add('ellipsis');
            pageNumbers.lastChild.textContent = '...';
        }
        // Пред. стр.
        if (currentPage > 1) {
            pageNumbers.appendChild(createPageButton(currentPage - 1));
        }

        pageNumbers.appendChild(createPageButton(currentPage));

        // След. стр.
        if (currentPage < totalPages) {
            pageNumbers.appendChild(createPageButton(currentPage + 1));
        }

        // Многоточие правое
        if (currentPage < totalPages - 2) {
            pageNumbers.appendChild(document.createElement('span')).classList.add('ellipsis');
            pageNumbers.lastChild.textContent = '...';
        }

        // Последняя страница
        if (currentPage < totalPages - 1) {
            pageNumbers.appendChild(createPageButton(totalPages));
        }
    }

    fetchMovies(currentPage);

    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchMovies(currentPage);
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            fetchMovies(currentPage);
        }
    });

    genreSelect.addEventListener('change', () => fetchMovies(currentPage = 1));
    releaseYearSlider.noUiSlider.on('change', () => fetchMovies(currentPage = 1));
    ratingSlider.noUiSlider.on('change', () => fetchMovies(currentPage = 1));
    sortSelect.addEventListener('change', () => fetchMovies(currentPage));

    function showSidebar(movie, posterPath) {
        sidebarContent.innerHTML = `
            <span class="close-btn">&times;</span>
            <img src="${posterPath}" alt="${movie.name}">
            <h2>${movie.name}</h2>
            <p><strong>Год выхода:</strong> ${movie.year}</p>
            <p><strong>Жанры:</strong> ${movie.genres}</p>
            <p>${movie.description}</p>
        `;
        sidebar.style.width = '500px';
    }

    function showReviewModal(movieTitle, movieId) {
        modalContent.innerHTML = `
            <span class="close-btn">&times;</span>
            <h2>Оставить отзыв о "${movieTitle}"</h2>
            <div class="rating-container">
                <label>Оценка:</label>
                <div id="ratingNumbers" class="rating-numbers">
                    ${[...Array(11).keys()].slice(1).map(i => `<span class="rating-number" data-rating="${i}" data-original-color="${setRatingColor(i)}" style="color: ${setRatingColor(i)};">${i}</span>`).join('')}
                </div>
                <div id="ratingMessage" style="color: red; display: none;"></div>
            </div>
            <textarea id="reviewText"></textarea>
            <button id="submitReview" class="btn">Оставить отзыв</button>
            <div id="reviewMessage" style="color: green; display: none;"></div>
            <p>Последние 10 отзывов</p>
            <div id="reviewsContainer"></div>
        `;
        
        loadReviews(movieId);

        // Закрытие модал. при нажатии на крестик
        const closeModal = modalContent.querySelector('.close-btn');
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
            document.body.classList.remove('no-scroll');
            document.body.style.paddingRight = '';
        });

        // Закрытие модал. при нажатии вне окна
        window.addEventListener('click', (event) => {
            if (event.target == modal) {
                modal.style.display = 'none';
                document.body.classList.remove('no-scroll');
                document.body.style.paddingRight = '';
            }
        });

        // Изменение размеров <body> при открытии модал.
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.paddingRight = `${scrollbarWidth}px`;

        modal.style.display = 'block';
        document.body.classList.add('no-scroll');
        
        const ratingNumbers = modalContent.querySelectorAll('.rating-number');
        let selectedRatingElement = null;
        let selectedRating = null;

        // Изменение цветов при нажатии на оценки
        ratingNumbers.forEach(number => {
            number.addEventListener('click', () => {
                if (selectedRatingElement) {
                    const originalColor = selectedRatingElement.getAttribute('data-original-color');
                    selectedRatingElement.style.color = originalColor;
                    selectedRatingElement.classList.remove('selected');
                }
                number.style.color = 'white';
                number.style.setProperty('--bg-color', number.getAttribute('data-original-color'));
                number.classList.add('selected');
                selectedRatingElement = number;
                selectedRating = number.getAttribute('data-rating');
            });
        });

        const submitReview = modalContent.querySelector('#submitReview');
        const reviewTextElement = document.getElementById('reviewText');

        submitReview.addEventListener('click', () => {
            const reviewText = reviewTextElement.value;

            if (!selectedRating) {
                displayRatingMessage('Пожалуйста, выберите оценку.', 'red');
                return;
            }

            const reviewData = {
                movieId: movieId,
                rating: selectedRating,
                reviewText: reviewText
            };

            fetch(reviewsURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reviewData)
            })
                .then(response => response.text())
                .then(data => {
                    displayReviewMessage('Отзыв успешно сохранен', 'green');
                    
                    // Очищение выбранных элементов
                    const originalColor = selectedRatingElement.getAttribute('data-original-color');
                    selectedRatingElement.style.color = originalColor;
                    selectedRatingElement.classList.remove('selected');
                    reviewTextElement.value = '';
                    selectedRatingElement = null;
                    selectedRating = null;

                    // Обновление списка отзывов
                    loadReviews(movieId);

                    // Обновление списка фильмов
                    fetchMovies(currentPage);
                })
                .catch(error => {
                    console.error('Ошибка:', error);
                    displayReviewMessage('Ошибка при сохранении отзыва', 'red');
                });
        });

        const ratingMessageDiv = modalContent.querySelector('#ratingMessage');
        function displayRatingMessage(message, color) {
            ratingMessageDiv.style.color = color;
            ratingMessageDiv.style.display = 'block';
            ratingMessageDiv.textContent = message;
        }

        function displayReviewMessage(message, color) {
            const reviewMessageDiv = modalContent.querySelector('#reviewMessage');
            reviewMessageDiv.style.color = color;
            ratingMessageDiv.style.display = 'none';
            reviewMessageDiv.style.display = 'block';
            reviewMessageDiv.textContent = message;
        }
    }

    function loadReviews(movieId) {
        fetch(`${reviewsURL}/${movieId}`)
            .then(response => response.json())
            .then(reviews => {
                const reviewsContainer = document.getElementById('reviewsContainer');
                if (reviews.length > 0) {
                    reviewsContainer.innerHTML = reviews.map(review => {
                        const reviewText = review.review_text ? review.review_text : '';
                        const wordCount = reviewText.split(' ').length;
                        const truncatedText = reviewText.split(' ').slice(0, 50).join(' ');

                        return `
                            <div class="review">
                                <div class="review-header">
                                    <span class="review-username">Гость</span>
                                    <span class="review-date">${formatDate(review.created_at)}</span>
                                    <span class="review-rating" style="color: ${setRatingColor(review.rating)};">${review.rating}</span>
                                </div>
                                <div class="review-text" data-full-text="${reviewText}" data-collapsed-text="${truncatedText}">
                                    ${wordCount > 50 ? `${truncatedText}... <span class="read-more">читать дальше</span>` : reviewText}
                                </div>
                            </div>
                        `;
                    }).join('');

                    readMoreEventListeners();
                } else {
                    reviewsContainer.innerHTML = '<p>Отзывов пока что нет.</p>';
                }
            })
            .catch(error => console.error('Ошибка при загрузке отзывов:', error));
    }

    // Функция для форматирования даты
    function formatDate(timestamp) {
        const date = new Date(timestamp);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }

    // Функция для событий к кнопкам «Подробнее»
    function readMoreEventListeners() {
        const readMoreButtons = document.querySelectorAll('.read-more');
        readMoreButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const reviewTextElement = event.target.parentElement;
                reviewTextElement.innerHTML = `
                    ${reviewTextElement.dataset.fullText} <span class="collapse">свернуть</span>
                `;
                collapseEventListeners();
            });
        });
    }
    
    function collapseEventListeners() {
        const collapseButtons = document.querySelectorAll('.collapse');
        collapseButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const reviewTextElement = event.target.parentElement;
                reviewTextElement.innerHTML = `
                    ${reviewTextElement.dataset.collapsedText}... <span class="read-more">читать дальше</span>
                `;
                readMoreEventListeners();
            });
        });
    }    

    // Закрытие сайдбара при нажатии вне окна
    document.addEventListener('click', (event) => {
        if (!sidebar.contains(event.target) && !event.target.closest('.movie-card img')) {
            sidebar.style.width = '0';
        }
    });

    // Закрытие сайдбара при нажатии на крестик
    document.addEventListener('click', (event) => {
        if (event.target.matches('.close-btn')) {
            sidebar.style.width = '0';
        }
    });

    // Закрытие сайдбара при нажатии на ESC
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            sidebar.style.width = '0';
        }
    });
});
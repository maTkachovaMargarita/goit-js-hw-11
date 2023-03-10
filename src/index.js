import { Notify } from 'notiflix/build/notiflix-notify-aio';

import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

import ImageApiService from './pixabay-api.js';
// import './sass/gallery.scss';

const refs = {
  form: document.querySelector('#search-form'),
  gallery: document.querySelector('.gallery'),
  endSearchInfo: document.querySelector('.end-search__info'),
};
const { form, gallery, endSearchInfo } = refs;

const imageApiService = new ImageApiService();

// Add submit listener
form.addEventListener('submit', onSearch);

// Add global variables
let shownImages = 0;
let lightbox = {};

const infiniteObserver = new IntersectionObserver(
  ([entry], observer) => {
    if (entry.isIntersecting) {
      observer.unobserve(entry.target);

      loadMore();
    }
  },
  { root: null, rootMargin: '50px', threshold: 0.5 }
);

async function onSearch(event) {
  event.preventDefault();

  resetGallery();
  imageApiService.resetPage();
  hideEndMessage();

  imageApiService.query = form.elements.searchQuery.value.trim();

  try {
    const data = await imageApiService.fetchQuery();

    if (data.totalHits === 0) {
      return Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.',
        {
          position: 'right-top',
        }
      );
    }

    shownImages = data.hits.length;

    Notify.success(`Hooray! We found ${data.totalHits} images.`, {
      position: 'right-top',
    });

    appendCardsMurkup(data.hits);
    addLightbox();

    addObserveOrshowEndMessage(data.totalHits);
  } catch (error) {
    console.log(error);
  }
}

async function loadMore() {
  try {
    const data = await imageApiService.fetchQuery();
    appendCardsMurkup(data.hits);

    lightbox.refresh();

    shownImages += data.hits.length;

    addObserveOrshowEndMessage(data.totalHits);
  } catch (error) {
    console.log(error);
  }
}

function addObserve() {
  const lastCard = document.querySelector('.photo-card:last-child');

  if (lastCard) {
    infiniteObserver.observe(lastCard);
  }
}

function addObserveOrshowEndMessage(totalHits) {
  if (shownImages < totalHits) {
    addObserve();
  } else {
    showEndMessage();
  }
}

function generateCardsMurkup(cardsArray) {
  return cardsArray
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => {
        return `<a href="${largeImageURL}" class="photo-card">
        <img src="${webformatURL}" alt="${tags}" class="photo-card__img" width="300" loading="lazy" />
        <div class="info">
          <p class="info-item"><b>Likes</b><br />${likes}</p>
          <p class="info-item"><b>Views</b><br />${views}</p>
          <p class="info-item"><b>Comments</b><br />${comments}</p>
          <p class="info-item"><b>Downloads</b><br />${downloads}</p>
        </div>
      </a>`;
      }
    )
    .join('');
}

function appendCardsMurkup(cards) {
  gallery.insertAdjacentHTML('beforeend', generateCardsMurkup(cards));
}

function resetGallery() {
  gallery.innerHTML = '';
}

function addLightbox() {
  lightbox = new SimpleLightbox('.gallery a', {
    showCounter: false,
    captionsData: 'alt',
    captionDelay: 250,
  });
}

function showEndMessage() {
  endSearchInfo.classList.add('show');
}

function hideEndMessage() {
  endSearchInfo.classList.remove('show');
}

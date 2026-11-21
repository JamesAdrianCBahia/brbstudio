import { getJson } from './admin-api.js';

const API_BASE = '/api/admin/services';

const elements = {
  grid: document.getElementById('serviceGrid'),
  status: document.getElementById('serviceStatus'),
  cardTemplate: document.getElementById('serviceCardTemplate'),
  addButton: document.getElementById('addServiceButton'),
  toast: document.getElementById('toast'),

  serviceDialog: document.getElementById('serviceDialog'),
  serviceForm: document.getElementById('serviceForm'),
  serviceDialogTitle: document.getElementById('serviceDialogTitle'),
  serviceFormError: document.getElementById('serviceFormError'),
  serviceSubmit: document.getElementById('serviceSubmitButton'),
  imageInput: document.getElementById('serviceImage'),
  imagePreview: document.getElementById('imagePreview'),
  imagePlaceholder: document.getElementById('imagePlaceholder'),
  chooseImageLabel: document.getElementById('chooseImageLabel'),
  removeImageButton: document.getElementById('removeImageButton'),
  availableInput: document.getElementById('serviceAvailable'),
  availableLabel: document.getElementById('serviceAvailableLabel'),

  deleteDialog: document.getElementById('deleteDialog'),
  deleteMessage: document.getElementById('deleteMessage'),
  deleteError: document.getElementById('deleteError'),
  confirmDelete: document.getElementById('confirmDeleteButton'),
};

let services = [];

function formatPrice(price) {
  const amount = Number(price);
  const decimals = Number.isInteger(amount) ? 0 : 2;

  return `\u20B1 ${amount.toLocaleString('en-PH', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

function createCard(service) {
  const card = elements.cardTemplate.content.firstElementChild.cloneNode(true);
  const image = card.querySelector('.service-card__image');
  const placeholder = card.querySelector('.service-card__placeholder');
  const description = card.querySelector('.service-card__description');
  const toggle = card.querySelector('[data-action="toggle"]');

  card.dataset.id = service.id;
  card.classList.toggle('service-card--inactive', !service.available);

  card.querySelector('.service-card__name').textContent = service.name;
  card.querySelector('.service-card__price').textContent = formatPrice(service.price);
  card.querySelector('.service-card__status').title = service.available ? 'Active' : 'Inactive';
  description.textContent = service.description;
  description.title = service.description;

  image.hidden = !service.imageUrl;
  placeholder.hidden = Boolean(service.imageUrl);
  if (service.imageUrl) {
    image.src = service.imageUrl;
    image.alt = service.name;
  }

  toggle.checked = service.available;
  setAvailabilityLabel(card.querySelector('.switch__label'), service.available);

  return card;
}

function renderServices() {
  elements.grid.replaceChildren(...services.map(createCard));

  elements.status.hidden = services.length > 0;
  if (services.length === 0) {
    elements.status.textContent = 'No services yet. Click "+ Add Service" to create the first one.';
  }
}

async function loadServices() {
  try {
    services = await getJson(API_BASE);
    renderServices();
  } catch (error) {
    console.error('Could not load services:', error);
    elements.status.textContent = 'Unable to load services. Please refresh the page.';
    elements.status.hidden = false;
  }
}

loadServices();

const API_BASE = '/api/admin/dashboard';

const elements = {
  stats: document.querySelectorAll('[data-stat]'),
  upcomingList: document.getElementById('upcomingList'),
  upcomingStatus: document.getElementById('upcomingStatus'),
  upcomingTemplate: document.getElementById('upcomingItemTemplate'),
};

const longDateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});
const shortMonthFormat = new Intl.DateTimeFormat('en-US', { month: 'short' });

async function fetchJson(path) {
  const response = await fetch(`${API_BASE}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

async function loadSummary() {
  try {
    const summary = await fetchJson('/summary');

    elements.stats.forEach((element) => {
      const value = summary[element.dataset.stat];
      element.textContent = Number(value).toLocaleString('en-PH');
    });
  } catch (error) {
    console.error('Could not load dashboard summary:', error);
  }
}

loadSummary();

function createUpcomingItem(booking) {
  const item = elements.upcomingTemplate.content.cloneNode(true);
  const eventDate = fromIsoDate(booking.eventDate);

  item.querySelector('.upcoming-item__month').textContent = shortMonthFormat.format(eventDate);
  item.querySelector('.upcoming-item__day').textContent = eventDate.getDate();
  item.querySelector('.upcoming-item__service').textContent = booking.serviceName;
  item.querySelector('.upcoming-item__client').textContent =
    `${booking.clientName} - ${booking.startTime}`;

  return item;
}

async function loadUpcomingBookings() {
  try {
    const bookings = await fetchJson('/upcoming-bookings');

    elements.upcomingList.replaceChildren(...bookings.map(createUpcomingItem));
    elements.upcomingStatus.hidden = bookings.length > 0;

    if (bookings.length === 0) {
      showMessage(elements.upcomingStatus, 'No upcoming bookings.');
    }
  } catch (error) {
    console.error('Could not load upcoming bookings:', error);
    showMessage(elements.upcomingStatus, 'Unable to load upcoming bookings.');
  }
}

loadSummary();
loadUpcomingBookings();
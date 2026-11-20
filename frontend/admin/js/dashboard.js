const API_BASE = '/api/admin/dashboard';

const elements = {
  stats: document.querySelectorAll('[data-stat]'),
};

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
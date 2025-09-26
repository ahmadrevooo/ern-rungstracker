const STORAGE_KEY = 'nutrition-tracker-entries';
const entryForm = document.getElementById('entry-form');
const editDialog = document.getElementById('edit-dialog');
const editForm = document.getElementById('edit-form');
const summaryDateInput = document.getElementById('summary-date');
const entryDateInput = document.getElementById('entry-date');
const entriesBody = document.getElementById('entries-body');
const totals = {
  calories: document.getElementById('total-calories'),
  protein: document.getElementById('total-protein'),
  carbs: document.getElementById('total-carbs'),
  fat: document.getElementById('total-fat'),
};

let entries = [];
let selectedDate = new Date().toISOString().slice(0, 10);

function loadEntries() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        entries = parsed;
      }
    }
  } catch (error) {
    console.error('Konnte gespeicherte Daten nicht laden:', error);
    entries = [];
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function formatNumber(value, decimals = 0) {
  return Number(value).toLocaleString('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function clearTable() {
  entriesBody.innerHTML = '';
}

function showEmptyState() {
  const row = document.createElement('tr');
  row.className = 'empty-row';
  const cell = document.createElement('td');
  cell.colSpan = 6;
  cell.textContent = 'Noch keine Einträge für dieses Datum';
  row.append(cell);
  entriesBody.append(row);
}

function renderEntries() {
  clearTable();
  const filtered = entries.filter((entry) => entry.date === selectedDate);

  if (!filtered.length) {
    showEmptyState();
  } else {
    const template = document.getElementById('entry-row-template');
    filtered
      .sort((a, b) => a.name.localeCompare(b.name, 'de'))
      .forEach((entry) => {
        const clone = template.content.firstElementChild.cloneNode(true);
        clone.dataset.id = entry.id;
        clone.querySelector('[data-field="name"]').textContent = entry.name;
        clone.querySelector('[data-field="calories"]').textContent = `${formatNumber(
          entry.calories,
        )} kcal`;
        clone.querySelector('[data-field="protein"]').textContent = `${formatNumber(
          entry.protein,
          1,
        )} g`;
        clone.querySelector('[data-field="carbs"]').textContent = `${formatNumber(
          entry.carbs,
          1,
        )} g`;
        clone.querySelector('[data-field="fat"]').textContent = `${formatNumber(
          entry.fat,
          1,
        )} g`;
        entriesBody.append(clone);
      });
  }

  updateTotals(filtered);
}

function updateTotals(filteredEntries) {
  const totalsData = filteredEntries.reduce(
    (acc, entry) => {
      acc.calories += Number(entry.calories) || 0;
      acc.protein += Number(entry.protein) || 0;
      acc.carbs += Number(entry.carbs) || 0;
      acc.fat += Number(entry.fat) || 0;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  totals.calories.textContent = formatNumber(totalsData.calories);
  totals.protein.innerHTML = `${formatNumber(totalsData.protein, 1)}&nbsp;g`;
  totals.carbs.innerHTML = `${formatNumber(totalsData.carbs, 1)}&nbsp;g`;
  totals.fat.innerHTML = `${formatNumber(totalsData.fat, 1)}&nbsp;g`;
}

function resetForm() {
  entryForm.reset();
  entryDateInput.value = selectedDate;
}

function handleFormSubmit(event) {
  event.preventDefault();
  const formData = new FormData(entryForm);
  const newEntry = {
    id: crypto.randomUUID(),
    date: formData.get('date'),
    name: formData.get('name').trim(),
    calories: Number(formData.get('calories')),
    protein: Number(formData.get('protein')),
    carbs: Number(formData.get('carbs')),
    fat: Number(formData.get('fat')),
  };

  entries.push(newEntry);
  saveEntries();
  renderEntries();
  resetForm();
  entryForm.elements.name.focus();
}

function openEditDialog(entry) {
  document.getElementById('edit-id').value = entry.id;
  document.getElementById('edit-name').value = entry.name;
  document.getElementById('edit-calories').value = entry.calories;
  document.getElementById('edit-protein').value = entry.protein;
  document.getElementById('edit-carbs').value = entry.carbs;
  document.getElementById('edit-fat').value = entry.fat;
  editDialog.showModal();
}

function handleEditSubmit(event) {
  event.preventDefault();
  const id = document.getElementById('edit-id').value;
  const entryIndex = entries.findIndex((item) => item.id === id);
  if (entryIndex === -1) return;

  entries[entryIndex] = {
    ...entries[entryIndex],
    name: document.getElementById('edit-name').value.trim(),
    calories: Number(document.getElementById('edit-calories').value),
    protein: Number(document.getElementById('edit-protein').value),
    carbs: Number(document.getElementById('edit-carbs').value),
    fat: Number(document.getElementById('edit-fat').value),
  };

  saveEntries();
  renderEntries();
  editDialog.close();
}

function deleteEntry(id) {
  const confirmed = confirm('Möchtest du diesen Eintrag wirklich löschen?');
  if (!confirmed) return;

  entries = entries.filter((entry) => entry.id !== id);
  saveEntries();
  renderEntries();
}

function handleTableClick(event) {
  const actionButton = event.target.closest('button[data-action]');
  if (!actionButton) return;

  const row = actionButton.closest('tr');
  const id = row?.dataset.id;
  if (!id) return;

  const entry = entries.find((item) => item.id === id);
  if (!entry) return;

  if (actionButton.dataset.action === 'edit') {
    openEditDialog(entry);
  } else if (actionButton.dataset.action === 'delete') {
    deleteEntry(id);
  }
}

function initializeDates() {
  entryDateInput.value = selectedDate;
  summaryDateInput.value = selectedDate;
}

function handleSummaryDateChange(event) {
  selectedDate = event.target.value || selectedDate;
  entryDateInput.value = selectedDate;
  renderEntries();
}

function handleDialogCancel(event) {
  event.preventDefault();
  editDialog.close();
}

function setupEventListeners() {
  entryForm.addEventListener('submit', handleFormSubmit);
  editForm.addEventListener('submit', handleEditSubmit);
  editForm.querySelector('button[value="cancel"]').addEventListener('click', handleDialogCancel);
  summaryDateInput.addEventListener('change', handleSummaryDateChange);
  entriesBody.addEventListener('click', handleTableClick);
}

function init() {
  loadEntries();
  initializeDates();
  renderEntries();
  setupEventListeners();
}

window.addEventListener('DOMContentLoaded', init);

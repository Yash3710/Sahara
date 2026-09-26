import { supabase, requireAuth, apiRequest } from './supabaseClient.js';

const session = await requireAuth();
if (!session) throw new Error('Not authenticated');

// Elements
const uploadBtn = document.getElementById('upload-btn');
const uploadFormContainer = document.getElementById('upload-form-container');
const uploadForm = document.getElementById('upload-form');
const uploadSubmitBtn = document.getElementById('upload-submit-btn');
const uploadCancelBtn = document.getElementById('upload-cancel-btn');
const docFile = document.getElementById('doc-file');
const fileDropZone = document.getElementById('file-drop-zone');
const selectedFileName = document.getElementById('selected-file-name');
const documentsList = document.getElementById('documents-list');
const emptyState = document.getElementById('empty-state');
const catButtons = document.querySelectorAll('.cat-btn');

let currentCategory = 'all';
let allDocuments = [];

// Category labels for display
const categoryLabels = {
  id_document: 'ID Document',
  medical: 'Medical Record',
  prescription: 'Prescription',
  insurance: 'Insurance',
  legal: 'Legal',
  other: 'Other',
};

const categoryIcons = {
  id_document: 'id-card',
  medical: 'heart-pulse',
  prescription: 'pill',
  insurance: 'shield-check',
  legal: 'scale',
  other: 'file-text',
};

const categoryColors = {
  id_document: 'blue',
  medical: 'red',
  prescription: 'green',
  insurance: 'purple',
  legal: 'amber',
  other: 'gray',
};

// File drop zone click handler
fileDropZone.addEventListener('click', () => docFile.click());

docFile.addEventListener('change', () => {
  if (docFile.files.length > 0) {
    selectedFileName.textContent = docFile.files[0].name;
    selectedFileName.classList.remove('hidden');
  }
});

// Show/hide upload form
uploadBtn.addEventListener('click', () => {
  uploadFormContainer.classList.toggle('hidden');
  if (!uploadFormContainer.classList.contains('hidden')) {
    window.scrollTo({ top: uploadFormContainer.offsetTop - 20, behavior: 'smooth' });
  }
});

uploadCancelBtn.addEventListener('click', () => {
  uploadFormContainer.classList.add('hidden');
  uploadForm.reset();
  selectedFileName.classList.add('hidden');
});

// Category filter
catButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    currentCategory = btn.dataset.category;
    catButtons.forEach(b => {
      b.classList.remove('bg-green-600', 'text-white');
      b.classList.add('bg-gray-200', 'text-gray-700');
    });
    btn.classList.remove('bg-gray-200', 'text-gray-700');
    btn.classList.add('bg-green-600', 'text-white');
    renderDocuments();
  });
});

// Upload form submit
uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('doc-name').value.trim();
  const category = document.getElementById('doc-category').value;
  const notes = document.getElementById('doc-notes').value.trim();
  const file = docFile.files[0];

  if (!file) {
    alert('Please choose a file to upload.');
    return;
  }

  // File size limit: 10MB
  if (file.size > 10 * 1024 * 1024) {
    alert('File is too large. Please choose a file smaller than 10 MB.');
    return;
  }

  uploadSubmitBtn.disabled = true;
  uploadSubmitBtn.innerHTML = '<span class="spinner"></span> Uploading...';

  try {
    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${session.user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw new Error('Could not upload file. Please try again.');
    }

    // Save metadata to backend
    await apiRequest('/api/vault', {
      method: 'POST',
      body: JSON.stringify({
        name,
        category,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        storage_path: fileName,
        notes: notes || null,
      }),
    });

    // Reset form and reload
    uploadFormContainer.classList.add('hidden');
    uploadForm.reset();
    selectedFileName.classList.add('hidden');
    loadDocuments();

  } catch (err) {
    alert(err.message || 'Could not upload document. Please try again.');
  } finally {
    uploadSubmitBtn.disabled = false;
    uploadSubmitBtn.innerHTML = '<i data-lucide="upload" class="w-5 h-5"></i> Upload Document';
    if (window.lucide) lucide.createIcons();
  }
});

// Format file size
function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Format date
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

// Get download URL
async function getFileUrl(storagePath) {
  const { data } = await supabase.storage
    .from('documents')
    .createSignedUrl(storagePath, 3600); // 1 hour
  return data?.signedUrl || null;
}

// Delete document
async function deleteDoc(id, storagePath) {
  if (!confirm('Are you sure you want to delete this document?')) return;
  try {
    // Delete from storage
    await supabase.storage.from('documents').remove([storagePath]);
    // Delete metadata
    await apiRequest(`/api/vault/${id}`, { method: 'DELETE' });
    loadDocuments();
  } catch (err) {
    alert(err.message || 'Could not delete document.');
  }
}

// View/download document
async function viewDoc(storagePath) {
  try {
    const url = await getFileUrl(storagePath);
    if (url) {
      window.open(url, '_blank');
    } else {
      alert('Could not open document. Please try again.');
    }
  } catch {
    alert('Could not open document. Please try again.');
  }
}

// Global handlers
window.__viewDoc = (storagePath) => viewDoc(storagePath);
window.__deleteDoc = (id, storagePath) => deleteDoc(id, storagePath);

// Render documents
function renderDocuments() {
  const filtered = currentCategory === 'all' 
    ? allDocuments 
    : allDocuments.filter(d => d.category === currentCategory);

  if (filtered.length === 0) {
    documentsList.innerHTML = '';
    emptyState.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
    return;
  }

  emptyState.classList.add('hidden');
  documentsList.innerHTML = filtered.map(doc => {
    const color = categoryColors[doc.category] || 'gray';
    const icon = categoryIcons[doc.category] || 'file-text';
    const label = categoryLabels[doc.category] || 'Other';
    return `
      <div class="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between mb-3">
        <div class="flex items-center gap-4 flex-1 min-w-0">
          <div class="w-12 h-12 rounded-full bg-${color}-50 flex items-center justify-center shrink-0">
            <i data-lucide="${icon}" class="text-${color}-600 w-6 h-6"></i>
          </div>
          <div class="min-w-0">
            <p class="text-lg font-semibold text-gray-800 truncate">${doc.name}</p>
            <p class="text-sm text-gray-600">${label} · ${formatFileSize(doc.file_size)} · ${formatDate(doc.created_at)}</p>
            ${doc.notes ? `<p class="text-sm text-gray-500 mt-0.5 truncate">${doc.notes}</p>` : ''}
          </div>
        </div>
        <div class="flex gap-1 shrink-0 ml-3">
          <button onclick="window.__viewDoc('${doc.storage_path}')" class="p-2.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition" aria-label="View" title="View">
            <i data-lucide="eye" class="w-5 h-5"></i>
          </button>
          <button onclick="window.__deleteDoc('${doc.id}', '${doc.storage_path}')" class="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition" aria-label="Delete" title="Delete">
            <i data-lucide="trash-2" class="w-5 h-5"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
  if (window.lucide) lucide.createIcons();
}

// Load documents
async function loadDocuments() {
  try {
    const data = await apiRequest('/api/vault');
    allDocuments = data.data || [];
    renderDocuments();
  } catch (err) {
    documentsList.innerHTML = '<p class="text-base text-red-600 py-4">Could not load documents. Please refresh the page.</p>';
  }
}

loadDocuments();

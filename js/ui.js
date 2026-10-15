// Rendering, modal and toast helpers. No business logic lives here.
window.TaskFlow = window.TaskFlow || {};

TaskFlow.UI = (function () {
  const PRIORITY_CLASS = { Low: 'priority-low', Medium: 'priority-medium', High: 'priority-high' };
  const STATUS_CLASS = {
    'To Do': 'status-todo',
    'In Progress': 'status-in-progress',
    'Completed': 'status-completed'
  };

  const els = {
    taskList: document.getElementById('task-list'),
    emptyState: document.getElementById('empty-state'),
    taskModal: document.getElementById('task-modal'),
    taskModalTitle: document.getElementById('task-modal-title'),
    taskForm: document.getElementById('task-form'),
    confirmModal: document.getElementById('confirm-modal'),
    confirmMessage: document.getElementById('confirm-message'),
    toastContainer: document.getElementById('toast-container')
  };

  let confirmCallback = null;

  function todayISODate() {
    return new Date().toISOString().slice(0, 10);
  }

  function isOverdue(task) {
    return task.status !== 'Completed' && task.dueDate < todayISODate();
  }

  function formatDate(isoDate) {
    const parsed = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return isoDate;
    return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function buildTaskCard(task) {
    const card = document.createElement('article');
    card.className = 'task-card';
    card.dataset.taskId = task.id;

    const header = document.createElement('div');
    header.className = 'task-card-header';

    const title = document.createElement('h3');
    title.className = 'task-title';
    title.textContent = task.title;

    const priorityBadge = document.createElement('span');
    priorityBadge.className = `badge ${PRIORITY_CLASS[task.priority] || ''}`;
    priorityBadge.textContent = task.priority;

    header.append(title, priorityBadge);

    const description = document.createElement('p');
    description.className = 'task-description';
    description.textContent = task.description || 'No description provided.';

    const meta = document.createElement('div');
    meta.className = 'task-meta';

    const statusBadge = document.createElement('span');
    statusBadge.className = `badge ${STATUS_CLASS[task.status] || ''}`;
    statusBadge.textContent = task.status;

    const categoryTag = document.createElement('span');
    categoryTag.className = 'tag';
    categoryTag.textContent = task.category;

    const dueDate = document.createElement('span');
    dueDate.className = 'due-date' + (isOverdue(task) ? ' overdue' : '');
    dueDate.textContent = `Due ${formatDate(task.dueDate)}`;

    meta.append(statusBadge, categoryTag, dueDate);

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn btn-secondary';
    editBtn.dataset.action = 'edit';
    editBtn.textContent = 'Edit';

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.dataset.action = 'delete';
    deleteBtn.textContent = 'Delete';

    actions.append(editBtn, deleteBtn);

    card.append(header, description, meta, actions);
    return card;
  }

  function renderTasks(tasks) {
    els.taskList.innerHTML = '';
    if (!tasks.length) {
      els.emptyState.hidden = false;
      return;
    }
    els.emptyState.hidden = true;
    const sorted = [...tasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const fragment = document.createDocumentFragment();
    sorted.forEach((task) => fragment.appendChild(buildTaskCard(task)));
    els.taskList.appendChild(fragment);
  }

  function fillForm(task) {
    const form = els.taskForm;
    form.elements['title'].value = task ? task.title : '';
    form.elements['description'].value = task ? task.description : '';
    form.elements['priority'].value = task ? task.priority : 'Medium';
    form.elements['status'].value = task ? task.status : 'To Do';
    form.elements['category'].value = task ? task.category : '';
    form.elements['dueDate'].value = task ? task.dueDate : '';
  }

  function openTaskModal(mode, task) {
    clearFieldErrors();
    els.taskModalTitle.textContent = mode === 'edit' ? 'Edit Task' : 'Add Task';
    els.taskForm.dataset.mode = mode;
    els.taskForm.dataset.taskId = task ? task.id : '';
    fillForm(task);
    els.taskModal.hidden = false;
    document.getElementById('task-title').focus();
  }

  function closeTaskModal() {
    els.taskModal.hidden = true;
    els.taskForm.reset();
    clearFieldErrors();
  }

  const FIELD_INPUT_ID = {
    title: 'task-title',
    description: 'task-description',
    priority: 'task-priority',
    status: 'task-status',
    category: 'task-category',
    dueDate: 'task-due-date'
  };

  function displayFieldErrors(errors) {
    clearFieldErrors();
    Object.keys(errors).forEach((field) => {
      const errorEl = document.getElementById(`${field}-error`);
      const inputEl = document.getElementById(FIELD_INPUT_ID[field]);
      if (errorEl) errorEl.textContent = errors[field];
      if (inputEl) inputEl.classList.add('invalid');
    });
  }

  function clearFieldErrors() {
    document.querySelectorAll('.field-error').forEach((el) => (el.textContent = ''));
    document.querySelectorAll('.invalid').forEach((el) => el.classList.remove('invalid'));
  }

  function openConfirmModal(message, onConfirm) {
    els.confirmMessage.textContent = message;
    confirmCallback = onConfirm;
    els.confirmModal.hidden = false;
  }

  function closeConfirmModal() {
    els.confirmModal.hidden = true;
    confirmCallback = null;
  }

  function runConfirmCallback() {
    const cb = confirmCallback;
    closeConfirmModal();
    if (typeof cb === 'function') cb();
  }

  function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type === 'error' ? 'error' : 'success'}`;
    toast.textContent = message;
    els.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  return {
    renderTasks,
    openTaskModal,
    closeTaskModal,
    displayFieldErrors,
    clearFieldErrors,
    openConfirmModal,
    closeConfirmModal,
    runConfirmCallback,
    showToast
  };
})();

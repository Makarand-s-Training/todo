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

  function createInlineField(form, prefix, labelText, name, type, options) {
    const field = document.createElement('div');
    field.className = 'form-field';

    const label = document.createElement('label');
    const inputId = `${prefix}-${name}`;
    label.htmlFor = inputId;
    label.textContent = labelText;

    let input;
    if (type === 'textarea') {
      input = document.createElement('textarea');
      input.rows = 3;
      input.maxLength = 500;
    } else if (type === 'select') {
      input = document.createElement('select');
      options.forEach((value) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        input.appendChild(option);
      });
    } else {
      input = document.createElement('input');
      input.type = type;
      if (name === 'title') input.maxLength = 100;
      if (name === 'category') input.maxLength = 40;
    }

    input.id = inputId;
    input.name = name;

    const error = document.createElement('span');
    error.className = 'field-error';
    error.dataset.fieldError = name;

    field.append(label, input, error);
    form.appendChild(field);
  }

  function buildInlineForm(prefix) {
    const form = document.createElement('form');
    form.className = 'inline-task-form';
    form.noValidate = true;

    createInlineField(form, prefix, 'Title', 'title', 'text');
    createInlineField(form, prefix, 'Description', 'description', 'textarea');

    const detailsRow = document.createElement('div');
    detailsRow.className = 'form-row';
    form.appendChild(detailsRow);
    createInlineField(detailsRow, prefix, 'Priority', 'priority', 'select', ['Low', 'Medium', 'High']);
    createInlineField(detailsRow, prefix, 'Status', 'status', 'select', ['To Do', 'In Progress', 'Completed']);

    const categoryRow = document.createElement('div');
    categoryRow.className = 'form-row';
    form.appendChild(categoryRow);
    createInlineField(categoryRow, prefix, 'Category', 'category', 'text');
    createInlineField(categoryRow, prefix, 'Due Date', 'dueDate', 'date');

    const actions = document.createElement('div');
    actions.className = 'modal-actions inline-form-actions';

    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'btn btn-secondary';
    cancel.dataset.action = 'cancel-edit';
    cancel.textContent = 'Cancel';

    const save = document.createElement('button');
    save.type = 'submit';
    save.className = 'btn btn-primary';
    save.textContent = 'Save Task';

    actions.append(cancel, save);
    form.appendChild(actions);
    return form;
  }

  function buildTaskCard(task, index) {
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

    const detailsId = `task-details-${index}`;
    const details = document.createElement('div');
    details.id = detailsId;
    details.className = 'task-details';
    details.hidden = true;
    details.append(description, buildInlineForm(`task-${index}`));

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

    const moreBtn = document.createElement('button');
    moreBtn.type = 'button';
    moreBtn.className = 'btn btn-secondary';
    moreBtn.dataset.action = 'toggle-details';
    moreBtn.setAttribute('aria-expanded', 'false');
    moreBtn.setAttribute('aria-controls', detailsId);
    moreBtn.textContent = 'More';

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.dataset.action = 'delete';
    deleteBtn.textContent = 'Delete';

    actions.append(moreBtn, deleteBtn);

    card.append(header, meta, actions, details);
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
    sorted.forEach((task, index) => fragment.appendChild(buildTaskCard(task, index)));
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

  function displayFieldErrors(errors, form = els.taskForm) {
    clearFieldErrors(form);
    Object.keys(errors).forEach((field) => {
      const errorEl = form.querySelector(`[data-field-error="${field}"]`) ||
        (form === els.taskForm ? document.getElementById(`${field}-error`) : null);
      const inputEl = form.elements[field] || document.getElementById(FIELD_INPUT_ID[field]);
      if (errorEl) errorEl.textContent = errors[field];
      if (inputEl) inputEl.classList.add('invalid');
    });
  }

  function clearFieldErrors(form = els.taskForm) {
    form.querySelectorAll('.field-error').forEach((el) => (el.textContent = ''));
    form.querySelectorAll('.invalid').forEach((el) => el.classList.remove('invalid'));
  }

  function fillInlineForm(form, task) {
    form.elements.title.value = task.title;
    form.elements.description.value = task.description;
    form.elements.priority.value = task.priority;
    form.elements.status.value = task.status;
    form.elements.category.value = task.category;
    form.elements.dueDate.value = task.dueDate;
    clearFieldErrors(form);
  }

  function setDetailsExpanded(card, expanded, task) {
    const button = card.querySelector('[data-action="toggle-details"]');
    const details = card.querySelector('.task-details');
    if (expanded && task) fillInlineForm(details.querySelector('form'), task);
    details.hidden = !expanded;
    button.setAttribute('aria-expanded', String(expanded));
    button.textContent = expanded ? 'Less' : 'More';
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
    fillInlineForm,
    setDetailsExpanded,
    openConfirmModal,
    closeConfirmModal,
    runConfirmCallback,
    showToast
  };
})();

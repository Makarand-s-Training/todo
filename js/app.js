// Application state and event wiring (the CRUD controller).
window.TaskFlow = window.TaskFlow || {};

TaskFlow.App = (function () {
  const Storage = TaskFlow.Storage;
  const Validation = TaskFlow.Validation;
  const UI = TaskFlow.UI;

  const state = { tasks: [] };

  function generateId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function persist() {
    const result = Storage.saveTasks(state.tasks);
    if (!result.success) {
      UI.showToast(`Could not save changes: ${result.error}`, 'error');
    }
    return result.success;
  }

  function readFormData(form) {
    return {
      title: form.elements['title'].value,
      description: form.elements['description'].value,
      priority: form.elements['priority'].value,
      status: form.elements['status'].value,
      category: form.elements['category'].value,
      dueDate: form.elements['dueDate'].value
    };
  }

  function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const data = readFormData(form);
    const { isValid, errors } = Validation.validateTask(data);

    if (!isValid) {
      UI.displayFieldErrors(errors);
      return;
    }

    const now = new Date().toISOString();
    const mode = form.dataset.mode;

    if (mode === 'edit') {
      const taskId = form.dataset.taskId;
      const index = state.tasks.findIndex((t) => t.id === taskId);
      if (index === -1) {
        UI.showToast('That task no longer exists.', 'error');
        UI.closeTaskModal();
        return;
      }
      state.tasks[index] = { ...state.tasks[index], ...data, updatedAt: now };
      if (persist()) {
        UI.showToast('Task updated.', 'success');
      }
    } else {
      const newTask = { id: generateId(), ...data, createdAt: now, updatedAt: now };
      state.tasks.push(newTask);
      if (persist()) {
        UI.showToast('Task added.', 'success');
      }
    }

    UI.renderTasks(state.tasks);
    UI.closeTaskModal();
  }

  function handleTaskListClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const card = event.target.closest('.task-card');
    const taskId = card && card.dataset.taskId;
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (button.dataset.action === 'edit') {
      UI.openTaskModal('edit', task);
    }
  }

  function bindEvents() {
    document.getElementById('add-task-btn').addEventListener('click', () => {
      UI.openTaskModal('add', null);
    });

    document.getElementById('task-form').addEventListener('submit', handleFormSubmit);
    document.getElementById('task-cancel-btn').addEventListener('click', UI.closeTaskModal);
    document.getElementById('task-modal-close-btn').addEventListener('click', UI.closeTaskModal);

    document.getElementById('task-list').addEventListener('click', handleTaskListClick);

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      const taskModal = document.getElementById('task-modal');
      if (!taskModal.hidden) UI.closeTaskModal();
    });

    const taskModal = document.getElementById('task-modal');
    taskModal.addEventListener('click', (event) => {
      if (event.target === taskModal) UI.closeTaskModal();
    });
  }

  function init() {
    Storage.seedIfEmpty();
    const { tasks, error } = Storage.loadTasks();
    state.tasks = tasks;
    if (error) UI.showToast(error, 'error');
    UI.renderTasks(state.tasks);
    bindEvents();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', TaskFlow.App.init);

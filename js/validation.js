// Validation rules for the task form, shared by create and edit flows.
window.TaskFlow = window.TaskFlow || {};

TaskFlow.Validation = (function () {
  const PRIORITIES = ['Low', 'Medium', 'High'];
  const STATUSES = ['To Do', 'In Progress', 'Completed'];

  function validateTask(data) {
    const errors = {};

    const title = (data.title || '').trim();
    if (!title) {
      errors.title = 'Title is required.';
    } else if (title.length > 100) {
      errors.title = 'Title must be 100 characters or less.';
    }

    const description = (data.description || '').trim();
    if (description.length > 500) {
      errors.description = 'Description must be 500 characters or less.';
    }

    const category = (data.category || '').trim();
    if (!category) {
      errors.category = 'Category is required.';
    } else if (category.length > 40) {
      errors.category = 'Category must be 40 characters or less.';
    }

    if (!PRIORITIES.includes(data.priority)) {
      errors.priority = 'Select a valid priority.';
    }

    if (!STATUSES.includes(data.status)) {
      errors.status = 'Select a valid status.';
    }

    if (!data.dueDate) {
      errors.dueDate = 'Due date is required.';
    } else if (Number.isNaN(Date.parse(data.dueDate))) {
      errors.dueDate = 'Enter a valid date.';
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  }

  return {
    PRIORITIES,
    STATUSES,
    validateTask
  };
})();

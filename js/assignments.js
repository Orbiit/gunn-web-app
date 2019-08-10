// asgn = assignment

const IMPORTANCE_ALGORITHMIC_WEIGHT = 1;

const assignmentsById = {};
let currentId = 0;

class Assignment {

  constructor(props = {}) {
    this.setProps(props);
    this.id = currentId++;
    assignmentsById[this.id] = this;
    this.manager = null;
  }

  setProps({
    text = '',
    category = 'homework',
    importance = 0,
    dueObj,
    period = null,
    done = false
  } = {}) {
    if (text !== undefined) this.text = text;
    if (category) this.category = category;
    if (importance !== undefined) this.importance = importance;
    if (dueObj) this.setDue(dueObj);
    if (period !== undefined) this.period = period;
    if (done !== undefined) this.done = done;
  }

  setDue(dueObj) {
    this.dueObj = dueObj;
    this.due = Assignment.dateObjToDayInt(new Date(
      dueObj.y,
      dueObj.m,
      dueObj.d
    ));
  }

  get algorithmicValue() {
    return this.due + this.importance * IMPORTANCE_ALGORITHMIC_WEIGHT;
  }

  remove() {
    delete assignmentsById[this.id];
    if (this.manager) {
      const index = this.manager.assignments.indexOf(this);
      if (~index) this.manager.assignments.splice(index, 1);
      this.manager = null;
    }
  }

  managedBy(manager) {
    this.manager = manager;
    return this;
  }

  // used with the periods
  toHTML({isOverdue = false} = {}) {
    return html`
    <div class="asgn-line asgn-importance-${this.importance}" data-asgn-id="${this.id}">
      <button class="asgn-done-btn" aria-label="${localize(this.done ? 'undoneify' : 'doneify')}">
      <span class="asgn-due">${localize('due')}</span>
      <span class="asgn-text" tabindex="0">${escapeHTML(this.text)}</span>
    `;
  }

  // used in the upcoming assignments section
  toElem({isOverdue = false, getPeriodSpan = null} = {}) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('asgn-line');
    wrapper.classList.add('asgn-importance-' + this.importance);
    wrapper.dataset.asgnId = this.id;
    if (this.done) wrapper.classList.add('asgn-is-done');

    const doneBtn = document.createElement('button');
    doneBtn.classList.add('asgn-done-btn');
    doneBtn.setAttribute('aria-label', localize(this.done ? 'undoneify' : 'doneify'));
    wrapper.appendChild(doneBtn);

    const categoryBadge = document.createElement('span');
    categoryBadge.classList.add('asgn-category');
    categoryBadge.classList.add('asgn-category-' + this.category);
    categoryBadge.textContent = this.category;
    wrapper.appendChild(categoryBadge);

    if (isOverdue) {
      const overdueBadge = document.createElement('span');
      overdueBadge.classList.add('asgn-overdue');
      overdueBadge.textContent = localize('overdue');
      wrapper.appendChild(overdueBadge);
    }

    const content = document.createElement('span');
    content.classList.add('asgn-text');
    content.textContent = this.text;
    content.tabIndex = 0;
    wrapper.appendChild(content);

    const dueText = document.createElement('span');
    dueText.classList.add('asgn-due-date');
    dueText.innerHTML = localizeTime('due-date', {
      P: this.period && getPeriodSpan && getPeriodSpan(this.period),
      D: localizeTime('date', {
        M: months[this.dueObj.m],
        D: this.dueObj.d
      })
    });
    wrapper.appendChild(dueText);

    return wrapper;
  }

  toJSON() {
    return {
      text: this.text,
      category: this.category,
      importance: this.importance,
      dueObj: this.dueObj,
      period: this.period,
      done: this.done
    };
  }

  // UGWA uses local time zone to represent dates
  static dateObjToDayInt(dateObj) {
    const minutes = dateObj.getTime() / 1000 / 60 - dateObj.getTimezoneOffset();
    return Math.floor(minutes / 60 / 24);
  }

}

class AssignmentsManager {

  constructor(assignments = []) {
    this.assignments = assignments.map(json => new Assignment(json).managedBy(this));
  }

  addAssignment(asgn) {
    this.assignments.push(asgn.managedBy(this));
  }

  getAssignmentsFor(day) {
    return this.assignments.filter(({due}) => due === day);
  }

  // can use this for both generating "upcoming assignments" and deleting old
  // assignments
  getAssignmentsBefore(day) {
    return this.assignments.filter(({due}) => due <= day);
  }

  sortAssignmentsBy(mode = 'chrono-primero') {
    switch (mode) {
      case 'chrono-primero':
        this.assignments.sort((a, b) =>
          a.due === b.due
            ? b.importance - a.importance
            : b.due - a.due);
      case 'important-importance':
        this.assignments.sort((a, b) =>
          a.importance === b.importance
            ? b.due - a.due
            : b.importance - a.importance);
      case 'aLgOriThMs':
        this.assignments.sort((a, b) => b.algorithmicValue - a.algorithmicValue);
        break;
      default:
        throw new Error('idk how to do that');
    }
    return this;
  }

  toJSON() {
    return this.assignments;
  }

}

function initAssignments(editor, loadJSON = '') {
  try {
    loadJSON = JSON.parse(loadJSON);
    if (!Array.isArray(loadJSON)) throw 'something';
  } catch (e) {
    loadJSON = [];
  }
  const manager = new AssignmentsManager(loadJSON);
  const section = document.createElement('div');
  section.classList.add('asgn-upcoming');

  const heading = document.createElement('h1');
  heading.textContent = localize('asgn');
  section.appendChild(heading);

  const addBtn = document.createElement('button');
  addBtn.classList.add('material');
  addBtn.textContent = localize('add-asgn');
  ripple(addBtn);
  addBtn.addEventListener('click', e => {
    openEditor();
  });
  heading.appendChild(addBtn);

  const wrapper = document.createElement('div');
  wrapper.classList.add('asgn-wrapper');
  section.appendChild(wrapper);

  const openEditor = (asgn = new Assignment({dueObj: {
    y: lastToday.getFullYear(),
    m: lastToday.getMonth(),
    d: lastToday.getDate()
  }})) => {
    editor(asgn)
      .onSave(props => asgn.setProps(props))
      .onDelete(() => asgn.remove())
      .onFinish(() => {
        methods.todayIs(lastToday, lastSort);
      });
  };

  document.addEventListener('click', e => {
    const asgnLine = e.target.closest('asgn');
    if (asgnLine) {
      const assignment = assignmentsById[asgnLine.dataset.asgnId];
      if (e.target.classList.contains('asgn-done-btn')) {
        //
      } else if (e.target.classList.contains('asgn-text')) {
        openEditor(assignment);
      }
    }
  });

  let lastToday, lastSort;
  const methods = {
    todayIs(date, sort = 'chrono-primero') {
      const today = Assignment.dateObjToDayInt(date || lastToday);
      wrapper.innerHTML = '';
      manager
        .sortAssignmentsBy(sort)
        .getAssignmentsBefore(today)
        .forEach(asgn => wrapper.appendChild(asgn.toElem()));
      lastToday = date;
      lastSort = sort;
    },
    displaySection(display = 'after') {
      if (display === 'none') {
        if (section.parentNode) section.parentNode.removeChild(section);
      } else {
        const insertPoint = document.getElementById(`asgn-sec-ins-${display}-pt`);
        insertPoint.parentNode.insertBefore(section, insertPoint);
      }
    },
    getScheduleAsgns(day) {
      const byPeriod = {};
      manager.getAssignmentsFor(day).forEach(asgn => {
        byPeriod[asgn.period || 'noPeriod'] = asgn.toHTML();
      });
      return byPeriod;
    }
  };
  return methods;
}

// asgn = assignment

const CONFETTI_RADIUS = 60;
const CONFETTI_COUNT = 50;
const CONFETTI_LIFE = 1000;
const CONFETTI_GRAVITY = 0.0002;
function createConfetti(x, y) {
  const canvas = document.createElement('canvas');
  canvas.classList.add('confetti');
  canvas.width = canvas.height = CONFETTI_RADIUS * 2;
  canvas.style.left = x + 'px';
  canvas.style.top = y + 'px';
  const c = canvas.getContext('2d');
  const confetti = [];
  for (let i = CONFETTI_COUNT; i--;) {
    confetti.push({
      x: 0,
      y: 0,
      xv: (Math.random() * 2 - 1) / 30,
      yv: -Math.random() * 0.1,
      fadeOffset: Math.random(),
      colour: Math.random() * 0x1000000
    });
  }
  document.body.appendChild(canvas);
  const start = currentTime();
  let lastTime = start;
  (function paint() {
    c.clearRect(0, 0, CONFETTI_RADIUS * 2, CONFETTI_RADIUS * 2);
    const now = currentTime();
    const elapsed = now - lastTime;
    for (let i = confetti.length; i--;) {
      const confetto = confetti[i];
      confetto.x += elapsed * confetto.xv;
      confetto.y += elapsed * confetto.yv;
      confetto.yv += elapsed * CONFETTI_GRAVITY;
      const age = now - start - confetto.fadeOffset;
      if (age > CONFETTI_LIFE) {
        confetti.splice(i, 1);
        continue;
      }
      // thancc https://github.com/anematode/grapheme/blob/master/build/grapheme.js#L1095
      c.fillStyle = `rgba(
        ${(confetto.colour >> 16) & 0xff},
        ${(confetto.colour >> 8) & 0xff},
        ${confetto.colour & 0xff},
        ${1 - (Math.max(age, 0) / CONFETTI_LIFE) ** 2}
      )`;
      c.fillRect(confetto.x + CONFETTI_RADIUS - 1, confetto.y + CONFETTI_RADIUS - 1, 2, 2);
    }
    lastTime = now;
    if (confetti.length) window.requestAnimationFrame(paint);
    else document.body.removeChild(canvas);
  })();
}

const IMPORTANCE_ALGORITHMIC_WEIGHT = 1;
const NADA = () => null;

const assignmentsById = {};
let currentId = 0;

function generateID() {
  return currentTime().toString(36) + Math.random().toString(36).slice(2);
}

class Assignment {

  constructor(props = {}, id = generateID()) {
    this.setProps(props);
    this.id = currentId++;
    this.assyncID = id;
    assignmentsById[this.id] = this;
    this.manager = null;
    if (!this.dueObj) this.dueObj = {d: 1, m: 0, y: 2000};
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
    if (period === 'null') period = null;
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

  // finished assignments are less important than unfinished ones
  get sortableImportance() {
    return this.done ? -1 : this.importance;
  }

  // lower is better
  get algorithmicValue() {
    return this.due - this.sortableImportance * IMPORTANCE_ALGORITHMIC_WEIGHT;
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
  toHTML({today} = {}) {
    return `
    <div class="asgn-line asgn-importance-${this.importance}${this.done ? ' asgn-is-done' : ''}" data-asgn-id="${this.id}">
      <button class="asgn-done-btn material icon" aria-label="${localize(this.done ? 'undoneify' : 'doneify')}"><i class="material-icons">${this.done ? '&#xe834;' : '&#xe835;'}</i></button>
      <span class="asgn-category asgn-category-${this.category}">${localize('asgn-cat-' + this.category)}</span>
      <span class="asgn-text" tabindex="0">${escapeHTML(this.text)}</span>
    </div>
    `;
  }

  // used in the upcoming assignments section
  toElem({today, getPeriodSpan = null} = {}) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('asgn-line');
    wrapper.classList.add('asgn-importance-' + this.importance);
    wrapper.dataset.asgnId = this.id;
    if (this.done) wrapper.classList.add('asgn-is-done');

    const doneBtn = document.createElement('button');
    doneBtn.classList.add('asgn-done-btn');
    doneBtn.classList.add('material');
    doneBtn.classList.add('icon');
    doneBtn.setAttribute('aria-label', localize(this.done ? 'undoneify' : 'doneify'));
    ripple(doneBtn);
    const icon = document.createElement('i');
    icon.classList.add('material-icons');
    icon.innerHTML = this.done ? '&#xe834;' : '&#xe835;';
    doneBtn.appendChild(icon);
    wrapper.appendChild(doneBtn);

    const categoryBadge = document.createElement('span');
    categoryBadge.classList.add('asgn-category');
    categoryBadge.classList.add('asgn-category-' + this.category);
    categoryBadge.textContent = localize('asgn-cat-' + this.category);
    wrapper.appendChild(categoryBadge);

    if (today > this.due) {
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
      done: this.done,
      assyncID: this.assyncID
    };
  }

  // for debugging purposes
  toString() {
    return `D${this.due} I${this.importance} C-${this.category} ${this.text}`;
  }

  // UGWA uses local time zone to represent dates
  static dateObjToDayInt(dateObj) {
    const minutes = dateObj.getTime() / 1000 / 60 - dateObj.getTimezoneOffset();
    return Math.floor(minutes / 60 / 24);
  }

}

class AssyncManager {

  constructor(hash = AssyncManager.newHash()) {
    this.hash = hash;
    this.status = document.createElement('div');
    this.setStatus('idk');
    document.body.appendChild(this.status);
  }

  setStatus(status = 'idk', type = 'load') {
    this.status.className = 'assync-status';
    switch (status) {
      case 'loading':
        this.status.textContent = localize(`assync-${type}ing`);
        this.status.classList.add('assync-loading');
        break;
      case 'loaded':
        this.status.textContent = localize(`assync-${type}ed`);
        this.status.classList.add('assync-disappearing');
        break;
      case 'problem':
        this.status.textContent = localize(`assync-${type}ing-problem`);
        this.status.classList.add('assync-error');
        this.status.classList.add('assync-disappearing');
        break;
      default:
        this.status.classList.add('assync-hidden');
    }
  }

  fetch() {
    this.setStatus('loading', 'load');
    return fetch(`https://www.jsonstore.io/${this.hash}`)
      .then(r => {
        this.setStatus('loaded', 'load');
        return r.json();
      })
      .then(({result, ok}) => ok ? result : Promise.reject(result))
      .catch(err => {
        logError(err);
        this.setStatus('problem', 'load');
        return Promise.reject(err);
      });
  }

  save(mode, asgn) {
    this.setStatus('loading', 'sav');
    return fetch(`https://www.jsonstore.io/${this.hash}/${asgn.assyncID || asgn}`, {
      headers: {
        'Content-type': 'application/json'
      },
      method: mode === 'DELETE' ? 'DELETE' : 'POST',
      body: mode === 'DELETE' ? null : JSON.stringify(asgn)
    })
      .then(r => {
        this.setStatus('loaded', 'sav');
        return r.json();
      })
      .then(({ok}) => ok ? null : Promise.reject())
      .catch(err => {
        logError(err);
        this.setStatus('problem', 'sav');
        return Promise.reject(err);
      });
  }

  static newHash() {
    let hash = '';
    while (hash.length < 64) {
      hash += Math.floor(Math.random() * 0x100000000).toString(16).padStart(8, '0');
    }
    return hash;
  }

}

class AssignmentsManager {

  constructor(assignments = [], assyncHash = null) {
    this.assignments = assignments.map(json => new Assignment(json, json.assyncID).managedBy(this));
    if (assyncHash) this.assyncAccount = new AssyncManager(assyncHash);
    this.failureQueue = [];
  }

  addAssignment(asgn) {
    this.assignments.push(asgn.managedBy(this));
  }

  getAssignmentsFor(day) {
    return this.assignments.filter(({due}) => due === day);
  }

  // for deleting old assignments
  getAssignmentsBefore(day) {
    return this.assignments.filter(({due}) => due <= day);
  }

  getAssignmentsToDoFor(day) {
    return this.assignments.filter(({due, done}) => !done || day <= due);
  }

  getAssignmentByAssyncId(id) {
    return this.assignments.find(({assyncID}) => assyncID === id);
  }

  // when you first create/join an account, not to be used afterwards
  async joinAssync(hash) {
    this.assyncAccount = new AssyncManager(hash);
    for (const asgn of this.assignments) {
      await this.updateAssignment(asgn);
    }
    return this.assyncAccount.hash;
  }

  async fetchAssignments() {
    while (this.failureQueue.length) {
      const [method, input] = this.failureQueue.shift();
      if (method === 'UPDATE') {
        await this.updateAssignment(input);
      } else if (method === 'DELETE') {
        await this.deleteAssignment(input);
      }
    }
    // if it fails, the promise catch handles the saving
    this.saveFailures();
    const assignments = await this.assyncAccount.fetch();
    const localAssignments = this.assignments.slice();
    Object.keys(assignments).forEach(id => {
      const index = localAssignments.findIndex(asgn => asgn && asgn.assyncID === id);
      if (~index) {
        localAssignments[index].setProps(assignments[id]);
        localAssignments[index] = null;
      } else {
        this.addAssignment(new Assignment(assignments[id], id));
      }
    });
    localAssignments.forEach(asgn => {
      if (asgn) {
        asgn.remove();
      }
    });
  }

  updateAssignment(asgn) {
    return this.assyncAccount.save('UPDATE', asgn).catch(err => {
      logError(err)
      this.failureQueue.push(['UPDATE', asgn]); // it's ok if the assignment gets JSONified
      this.saveFailures();
      return Promise.reject();
    });
  }

  deleteAssignment(id) {
    return this.assyncAccount.save('DELETE', id).catch(err => {
      logError(err)
      this.failureQueue.push(['DELETE', id]);
      this.saveFailures();
      return Promise.reject();
    });
  }

  sortAssignmentsBy(mode = 'chrono-primero') {
    switch (mode) {
      case 'chrono-primero':
        this.assignments.sort((a, b) =>
          a.done !== b.done
            ? a.done - b.done
            : a.due === b.due
              ? b.sortableImportance - a.sortableImportance
              : a.due - b.due);
        break;
      case 'important-importance':
        this.assignments.sort((a, b) =>
          a.done !== b.done
            ? a.done - b.done
            : a.importance === b.importance
              ? a.due - b.due
              : b.sortableImportance - a.sortableImportance);
        break;
      case 'aLgOriThMs':
        this.assignments.sort((a, b) =>
          a.done !== b.done
            ? a.done - b.done
            : a.algorithmicValue - b.algorithmicValue);
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

function initAssignments({
  editor = NADA,
  save = NADA,
  rerender = NADA,
  getDefaultDate = NADA,
  loadJSON = '',
  failQueueCookie = null,
  assyncID
}) {
  try {
    loadJSON = JSON.parse(loadJSON);
    if (!Array.isArray(loadJSON)) loadJSON = [];
  } catch (e) {
    logError(e)
    loadJSON = [];
  }
  const manager = new AssignmentsManager(loadJSON, assyncID);
  if (failQueueCookie) {
    try {
      manager.failureQueue = JSON.parse(cookie.getItem(failQueueCookie));
      if (!Array.isArray(manager.failureQueue)) manager.failureQueue = [];
    } catch (e) {
      logError(e)
      manager.failureQueue = [];
    }
    manager.saveFailures = () => {
      cookie.setItem(failQueueCookie, JSON.stringify(manager.failureQueue));
    };
  }
  const section = document.createElement('div');
  section.classList.add('asgn-upcoming');

  const heading = document.createElement('h1');
  heading.textContent = localize('asgn');
  section.appendChild(heading);

  const addBtn = document.createElement('button');
  addBtn.classList.add('material');
  addBtn.classList.add('icon');
  addBtn.classList.add('add-asgn');
  const icon = document.createElement('i');
  icon.classList.add('material-icons');
  icon.innerHTML = '&#xe145;';
  addBtn.appendChild(icon);
  ripple(addBtn);
  heading.appendChild(addBtn);

  const wrapper = document.createElement('div');
  wrapper.classList.add('asgn-wrapper');
  section.appendChild(wrapper);

  const openEditor = asgn => {
    editor(asgn)
      .onSave(props => {
        asgn.setProps(props);
        if (!asgn.manager) {
          manager.addAssignment(asgn);
        }
        if (manager.assyncAccount) {
          manager.updateAssignment(asgn);
        }
      })
      .onDelete(() => {
        asgn.remove();
        if (manager.assyncAccount) {
          manager.deleteAssignment(asgn.assyncID);
        }
      })
      .onFinish(() => {
        methods.todayIs();
        rerender();
      });
  };

  document.addEventListener('click', e => {
    if (e.target.classList.contains('add-asgn')) {
      openEditor(new Assignment({
        dueObj: getDefaultDate() || {
          y: lastToday.getFullYear(),
          m: lastToday.getMonth(),
          d: lastToday.getDate()
        },
        period: e.target.dataset.pd || null
      }));
      return;
    }
    const asgnLine = e.target.closest('.asgn-line');
    if (asgnLine) {
      const assignment = assignmentsById[asgnLine.dataset.asgnId];
      if (e.target.classList.contains('asgn-done-btn')) {
        assignment.done = !assignment.done;
        if (assignment.done) {
          createConfetti(e.clientX, e.clientY);
          asgnLine.classList.add('asgn-is-done');
        } else {
          asgnLine.classList.remove('asgn-is-done');
        }
        e.target.setAttribute('aria-label', localize(assignment.done ? 'undoneify' : 'doneify'));
        e.target.children[0].innerHTML = assignment.done ? '&#xe834;' : '&#xe835;';
        save();
        if (e.target.closest('.schedule-container')) {
          methods.todayIs();
        }
        rerender();
        if (manager.assyncAccount) {
          manager.updateAssignment(assignment);
        }
      } else if (e.target.classList.contains('asgn-text')) {
        openEditor(assignment);
      }
    }
  });

  let lastToday, lastSort, lastGetPeriodSpan;
  const methods = {
    todayIs(getPeriodSpan = lastGetPeriodSpan, date = lastToday, sort = lastSort) {
      const today = Assignment.dateObjToDayInt(date || lastToday);
      wrapper.innerHTML = '';
      manager
        .sortAssignmentsBy(sort)
        .getAssignmentsToDoFor(today + 1)
        .forEach(asgn => wrapper.appendChild(asgn.toElem({
          today,
          getPeriodSpan
        })));
      /*
      // I don't feel like deleting assignments
      manager
        .getAssignmentsBefore(today - 3)
        .forEach(asgn => asgn.remove());
      */
      lastGetPeriodSpan = getPeriodSpan;
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
    getScheduleAsgns(date, getPeriodSpan) {
      const today = Assignment.dateObjToDayInt(lastToday);
      const byPeriod = {};
      manager
        .sortAssignmentsBy('important-importance')
        .getAssignmentsFor(Assignment.dateObjToDayInt(date))
        .forEach(asgn => {
          if (!byPeriod[asgn.period || 'noPeriod']) {
            byPeriod[asgn.period || 'noPeriod'] = '';
          }
          byPeriod[asgn.period || 'noPeriod'] += asgn.toHTML({
            today
          });
        });
      return byPeriod;
    },
    getSaveable() {
      return JSON.stringify(manager);
    },
    joinAssync(hash) {
      return manager.joinAssync(hash);
    },
    leaveAssync() {
      manager.assyncAccount = null;
      manager.failureQueue = [];
      manager.saveFailures();
    },
    refreshAssync() {
      return manager.fetchAssignments()
        .then(() => {
          methods.todayIs();
          rerender();
        })
        .catch(logError);
    },
    insertButton(btn) {
      heading.insertBefore(btn, addBtn);
    }
  };
  return methods;
}

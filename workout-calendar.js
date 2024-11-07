const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .container {
      padding: 2rem;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;
    }

    .title {
      font-size: 1.5rem;
      font-weight: bold;
    }

    .calendar {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1rem;
    }

    .day {
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .day:hover {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .day-number {
      font-size: 1.125rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }

    .workout-info {
      font-size: 0.75rem;
    }

    .workout-info div {
      margin-bottom: 0.25rem;
    }

    .bg-gray-100 { background-color: #f3f4f6; }
    .bg-green-100 { background-color: #dcfce7; }
    .bg-green-300 { background-color: #86efac; }
    .bg-green-500 { background-color: #22c55e; }
    .bg-yellow-200 { background-color: #fef08a; }
    .border-yellow-400 { border-color: #facc15; }

    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      align-items: center;
      justify-content: center;
    }

    .modal.open {
      display: flex;
    }

    .modal-content {
      background-color: white;
      padding: 2rem;
      border-radius: 0.5rem;
      width: 90%;
      max-width: 500px;
    }

    .modal-header {
      font-size: 1.25rem;
      font-weight: bold;
      margin-bottom: 1.5rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    input {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      margin-bottom: 1rem;
    }

    .button-group {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    button {
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      cursor: pointer;
      font-weight: 500;
    }

    .button-primary {
      background-color: #2563eb;
      color: white;
      border: none;
    }

    .button-secondary {
      background-color: white;
      border: 1px solid #e5e7eb;
    }
  </style>

  <div class="container">
    <div class="header">
      <button class="button-secondary" id="prev-button">&lt;</button>
      <h1 class="title">
        <span class="current-month"></span> <span class="current-year"></span>
      </h1>
      <button class="button-secondary" id="next-button">&gt;</button>
    </div>
    <div class="calendar"></div>
  </div>

  <div class="modal">
    <div class="modal-content">
      <div class="modal-header">Workout for <span class="modal-date"></span></div>
      <div class="form-group">
        <label for="pushups">Pushups</label>
        <input type="number" id="pushups" name="pushups" min="0">
      </div>
      <div class="form-group">
        <label for="pullups">Pullups</label>
        <input type="number" id="pullups" name="pullups" min="0">
      </div>
      <div class="form-group">
        <label for="abs">Abs</label>
        <input type="number" id="abs" name="abs" min="0">
      </div>
      <div class="form-group">
        <label for="squats">Squats</label>
        <input type="number" id="squats" name="squats" min="0">
      </div>
      <div class="button-group">
        <button class="button-secondary" id="cancel-button">Cancel</button>
        <button class="button-primary" id="save-button">Save</button>
      </div>
    </div>
  </div>
`;

class WorkoutCalendar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    
    this.workouts = [];
    this.currentYear = new Date().getFullYear();
    this.currentMonth = new Date().getMonth();
    this.selectedDate = null;
    
    // Bind methods
    this.renderCalendar = this.renderCalendar.bind(this);
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.saveWorkout = this.saveWorkout.bind(this);
    this.navigateToPreviousMonth = this.navigateToPreviousMonth.bind(this);
    this.navigateToNextMonth = this.navigateToNextMonth.bind(this);
    
    // Add event listeners
    this.shadowRoot.getElementById('save-button').addEventListener('click', this.saveWorkout);
    this.shadowRoot.getElementById('cancel-button').addEventListener('click', this.closeModal);
    this.shadowRoot.getElementById('prev-button').addEventListener('click', this.navigateToPreviousMonth);
    this.shadowRoot.getElementById('next-button').addEventListener('click', this.navigateToNextMonth);
    
    // Load saved workouts
    this.loadWorkouts();
  }

  connectedCallback() {
    this.renderCalendar();
  }

  loadWorkouts() {
    const savedWorkouts = localStorage.getItem('workoutData');
    if (savedWorkouts) {
      this.workouts = JSON.parse(savedWorkouts).map(workout => ({
        ...workout,
        squats: workout.squats || 0
      }));
    }
  }

  getWorkoutIntensity(workout) {
    if (!workout) return 'bg-gray-100';
    const total = workout.pushups + workout.pullups + workout.abs + workout.squats;
    if (total > 150) return 'bg-green-500';
    if (total > 75) return 'bg-green-300';
    return 'bg-green-100';
  }

  isCurrentDay(day, month, year) {
    const currentDate = new Date();
    return currentDate.getDate() === day &&
           currentDate.getMonth() === month &&
           currentDate.getFullYear() === year;
  }

  openModal(date) {
    this.selectedDate = date;
    const modal = this.shadowRoot.querySelector('.modal');
    const modalDate = this.shadowRoot.querySelector('.modal-date');
    modalDate.textContent = date;

    const workout = this.workouts.find(w => w.date === date) || {
      pushups: 0,
      pullups: 0,
      abs: 0,
      squats: 0
    };

    this.shadowRoot.getElementById('pushups').value = workout.pushups;
    this.shadowRoot.getElementById('pullups').value = workout.pullups;
    this.shadowRoot.getElementById('abs').value = workout.abs;
    this.shadowRoot.getElementById('squats').value = workout.squats;

    modal.classList.add('open');
  }

  closeModal() {
    const modal = this.shadowRoot.querySelector('.modal');
    modal.classList.remove('open');
  }

  saveWorkout() {
    const workout = {
      date: this.selectedDate,
      pushups: parseInt(this.shadowRoot.getElementById('pushups').value) || 0,
      pullups: parseInt(this.shadowRoot.getElementById('pullups').value) || 0,
      abs: parseInt(this.shadowRoot.getElementById('abs').value) || 0,
      squats: parseInt(this.shadowRoot.getElementById('squats').value) || 0
    };

    const workoutIndex = this.workouts.findIndex(w => w.date === this.selectedDate);
    if (workoutIndex >= 0) {
      this.workouts[workoutIndex] = workout;
    } else {
      this.workouts.push(workout);
    }

    localStorage.setItem('workoutData', JSON.stringify(this.workouts));
    this.closeModal();
    this.renderCalendar();
  }

  navigateToPreviousMonth() {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.renderCalendar();
  }

  navigateToNextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.renderCalendar();
  }

  renderCalendar() {
    const calendarEl = this.shadowRoot.querySelector('.calendar');
    calendarEl.innerHTML = '';

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.shadowRoot.querySelector('.current-month').textContent = monthNames[this.currentMonth];
    this.shadowRoot.querySelector('.current-year').textContent = this.currentYear;

    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const workout = this.workouts.find(w => w.date === date);

      const dayEl = document.createElement('div');
      dayEl.className = `day ${this.isCurrentDay(day, this.currentMonth, this.currentYear) ? 'bg-yellow-200 border-yellow-400' : this.getWorkoutIntensity(workout)}`;
      
      dayEl.innerHTML = `
        <div class="day-number">${day}</div>
        ${workout ? `
          <div class="workout-info">
            <div>Pushups: ${workout.pushups}</div>
            <div>Pullups: ${workout.pullups}</div>
            <div>Abs: ${workout.abs}</div>
            <div>Squats: ${workout.squats}</div>
          </div>
        ` : ''}
      `;

      dayEl.addEventListener('click', () => this.openModal(date));
      calendarEl.appendChild(dayEl);
    }
  }
}

customElements.define('workout-calendar', WorkoutCalendar);

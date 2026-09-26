document.addEventListener('DOMContentLoaded', () => {

  // Date Constraints
 
  const today = new Date().toISOString().split('T')[0];

  // Prevent selecting future birth dates for pets
  const dobInput = document.getElementById('dob');
  if (dobInput) {
    dobInput.setAttribute('max', today);
  }

  // Prevent selecting past dates for appointments
  const apptDateInput = document.getElementById('date');
  if (apptDateInput) {
    apptDateInput.setAttribute('min', today);
  }

 
  // initializing and dropdown syncing

  const apptPetSelect = document.getElementById('apptPet');
  const petListBody = document.getElementById('pet-list-body');
  const reminderList = document.getElementById('reminder-list');
  const recordsBody = document.getElementById('records-body');
 const recordRowTemplate = document.getElementById('record-row-template');

  // Populate appointment pet dropdown from hardcoded HTML rows on load
  function syncInitialPetsToDropdown() {
    if (!petListBody || !apptPetSelect) return;
    const existingPetRows = petListBody.querySelectorAll('tr');
    
    existingPetRows.forEach((row) => {
      const nameCell = row.querySelector('td');
      if (nameCell) {
        const petName = nameCell.textContent.trim();
        addPetToDropdown(petName);
      }
    });
  }

  function addPetToDropdown(name) {
    if (!apptPetSelect) return;
    // Check if option already exists
    const exists = Array.from(apptPetSelect.options).some(
      (opt) => opt.value.toLowerCase() === name.toLowerCase()
    );
    if (!exists) {
      const option = document.createElement('option');
      option.value = name.toLowerCase();
      option.textContent = name;
      apptPetSelect.appendChild(option);
    }
  }

  function removePetFromDropdown(name) {
    if (!apptPetSelect) return;
    const options = Array.from(apptPetSelect.options);
    const optionToRemove = options.find(
      (opt) => opt.textContent.toLowerCase() === name.toLowerCase()
    );
    if (optionToRemove) {
      optionToRemove.remove();
    }
  }

  function removeAppointmentsForPet(petName) {
  if (!appointmentList) return;
  appointmentList.querySelectorAll('li').forEach((li) => {
    const nameEl = li.querySelector('.pet-name');
    if (nameEl && nameEl.textContent.trim().toLowerCase() === petName.toLowerCase()) {
      li.remove();
    }
  });
}

  function removeRemindersForPet(petName) {
  if (!reminderList) return;
  reminderList.querySelectorAll('li').forEach((li) => {
    const nameEl = li.querySelector('.pet-name');
    if (nameEl && nameEl.textContent.trim().toLowerCase() === petName.toLowerCase()) {
      li.remove();
    }
  });
}

  syncInitialPetsToDropdown();

  
  //  Pet registration form

  const petForm = document.querySelector('#pets form');
  const petRowTemplate = document.getElementById('pet-row-template');

  if (petForm) {
    petForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const petName = document.getElementById('petName').value.trim();
      const petType = document.getElementById('petType').value;
      const dob = document.getElementById('dob').value;

      if (!petName || !petType) return;

      const formattedDob = dob
        ? new Date(dob).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : 'N/A';

      // Clone template
      const clone = petRowTemplate.content.cloneNode(true);
      const tr = clone.querySelector('tr');

      clone.querySelector('.pet-name').textContent = petName;
      clone.querySelector('.pet-type').textContent =
        petType.charAt(0).toUpperCase() + petType.slice(1);
      
      const dobTd = clone.querySelector('.pet-dob');
      if (dob) {
        dobTd.innerHTML = `<time datetime="${dob}">${formattedDob}</time>`;
      } else {
        dobTd.textContent = 'N/A';
      }

      // Attach button event listeners
      const deleteBtn = clone.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', () => {
        tr.remove();
        removePetFromDropdown(petName);
        removeAppointmentsForPet(petName);
         removeRemindersForPet(petName);
        updateDashboardCounters();
      });

      const editBtn = clone.querySelector('.edit-btn');
      editBtn.addEventListener('click', () => {
        document.getElementById('petName').value = petName;
        document.getElementById('petType').value = petType;
        document.getElementById('dob').value = dob;
        tr.remove();
        removePetFromDropdown(petName);
        updateDashboardCounters();
      });

      petListBody.appendChild(clone);
      addPetToDropdown(petName);
      updateDashboardCounters();
      petForm.reset();
    });
  }

  // pet row buttons event listeners
  if (petListBody) {
    petListBody.querySelectorAll('tr').forEach((tr) => {
      const petName = tr.querySelector('td')?.textContent.trim();
      const deleteBtn = tr.querySelector('.delete-btn');
      const editBtn = tr.querySelector('.edit-btn');

      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          tr.remove();
          if (petName) removePetFromDropdown(petName);
          if (petName) removeAppointmentsForPet(petName); 
          if (petName) removeRemindersForPet(petName);
          updateDashboardCounters();
        });
      }

      if (editBtn) {
  editBtn.addEventListener('click', () => {
    const nameCell = tr.children[0]?.textContent.trim();
    const typeCell = tr.children[1]?.textContent.trim().toLowerCase();
    
    
    const timeEl = tr.children[2]?.querySelector('time');
    const dobValue = timeEl?.getAttribute('datetime') || '';

    document.getElementById('petName').value = nameCell || '';
    document.getElementById('petType').value = typeCell || '';
    document.getElementById('dob').value = dobValue; 

    tr.remove();
    if (petName) removePetFromDropdown(petName);
    updateDashboardCounters();
  });
}
    });
  }

 
  
  // Appointment scheduler 
  
  const apptForm = document.querySelector('#appointments form');
  const appointmentList = document.getElementById('appointment-list');
  const apptTemplate = document.getElementById('appointment-item-template');

  if (apptForm) {
    apptForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const petSelect = document.getElementById('apptPet');
      const petName = petSelect.options[petSelect.selectedIndex]?.text || '';
      const apptType = document.getElementById('apptType').value;
      const date = document.getElementById('date').value;
      const time = document.getElementById('time').value;
      const vet = document.getElementById('vet').value.trim();

      if (!petName || !apptType || !date || !vet) return;

      const formattedType = apptType.charAt(0).toUpperCase() + apptType.slice(1);
      const formattedDate = new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      let displayTime = '';
      if (time) {
        const [hours, minutes] = time.split(':');
        const hourNum = parseInt(hours, 10);
        const ampm = hourNum >= 12 ? 'PM' : 'AM';
        const formattedHour = hourNum % 12 || 12;
        displayTime = `, ${formattedHour}:${minutes} ${ampm}`;
      }

      const clone = apptTemplate.content.cloneNode(true);
      clone.querySelector('.pet-name').textContent = petName;
      clone.querySelector('.event-type').textContent = formattedType;
      clone.querySelector('.vet-name').textContent = vet;

      const timeEl = clone.querySelector('time');
      timeEl.setAttribute('datetime', `${date}T${time || '00:00'}`);
      timeEl.textContent = `${formattedDate}${displayTime}`;
      const cloneLi = clone.querySelector('li');

      const cloneDeleteBtn = clone.querySelector('.delete-btn');
      cloneDeleteBtn.addEventListener('click', () => {
        cloneLi.remove();
        updateDashboardCounters();
      });

      const cloneEditBtn = clone.querySelector('.edit-btn');
      cloneEditBtn.addEventListener('click', () => {
        document.getElementById('apptPet').value = petSelect.value;
        document.getElementById('apptType').value = apptType;
        document.getElementById('date').value = date;
        document.getElementById('time').value = time;
        apptForm.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
        cloneLi.remove();
        updateDashboardCounters();
      });

      appointmentList.appendChild(clone);
      updateDashboardCounters();
      apptForm.reset();
    });
  }

  // appointment list buttons event listeners
  if (appointmentList) {
    appointmentList.querySelectorAll('li').forEach((li) => {
      const deleteBtn = li.querySelector('.delete-btn');
      const editBtn = li.querySelector('.edit-btn');

      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          li.remove();
          updateDashboardCounters();
        });
      }

      if (editBtn) {
        editBtn.addEventListener('click', () => {
          const petNameText = li.querySelector('.pet-name')?.textContent.trim();
          const eventTypeText = li.querySelector('.event-type')?.textContent.trim().toLowerCase();
          const timeEl = li.querySelector('time');
          const datetimeValue = timeEl?.getAttribute('datetime') || '';
          const [datePart, timePart] = datetimeValue.split('T');

          const petSelect = document.getElementById('apptPet');
          const matchingOption = Array.from(petSelect.options).find(
            (opt) => opt.textContent.toLowerCase() === petNameText?.toLowerCase()
          );
          if (matchingOption) petSelect.value = matchingOption.value;

          document.getElementById('apptType').value = eventTypeText || '';
          document.getElementById('date').value = datePart || '';
          document.getElementById('time').value = timePart || '';
          apptForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
          li.remove();
          updateDashboardCounters();
        });
      }
    });
  }


  // User Auth Toggle (UI Demo State)
  
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const userProfile = document.getElementById('user-profile');

  if (loginBtn && logoutBtn && userProfile) {
    loginBtn.addEventListener('click', () => {
      loginBtn.style.display = 'none';
      if (signupBtn) signupBtn.style.display = 'none';
      userProfile.hidden = false;
    });

    logoutBtn.addEventListener('click', () => {
      loginBtn.style.display = 'inline-block';
      if (signupBtn) signupBtn.style.display = 'inline-block';
      userProfile.hidden = true;
    });
  }

 
  // Dashboar summary counter
  
  function updateDashboardCounters() {
    // Total Pets Count
     const totalPetsEl = document.getElementById('total-pets-count');
  if (totalPetsEl && petListBody) {
    totalPetsEl.textContent = petListBody.querySelectorAll('tr:not(.empty-state-row)').length;
  }

    // Upcoming Appointments Count
    const upcomingApptsEl = document.getElementById('upcoming-appointments-count');
  if (upcomingApptsEl && appointmentList) {
    upcomingApptsEl.textContent = appointmentList.querySelectorAll('li:not(.empty-state-li)').length;
  }

    // Overdue Reminders Count
    const overdueRemindersEl = document.getElementById('overdue-reminders-count');
    // const reminderList = document.getElementById('reminder-list');
    if (overdueRemindersEl && reminderList) {
      const overdueItems = reminderList.querySelectorAll('li[data-due="overdue"]');
      overdueRemindersEl.textContent = overdueItems.length;
    }
        // empty state checks
    if (petListBody) toggleTableEmptyState(petListBody, 4, 'No pets registered yet — add one above.');
    if (appointmentList) toggleListEmptyState(appointmentList, 'No upcoming appointments.');
    if (reminderList) toggleListEmptyState(reminderList, 'No reminders right now.');
    if (recordsBody) toggleTableEmptyState(recordsBody, 4, 'No medical records yet.');
  }
  // empty state handling
  function toggleTableEmptyState(tbody, colspan, message) {
  const existingEmptyRow = tbody.querySelector('.empty-state-row');
  const hasRealRows = tbody.querySelectorAll('tr:not(.empty-state-row)').length > 0;

  if (hasRealRows) {
    if (existingEmptyRow) existingEmptyRow.remove();
  } else if (!existingEmptyRow) {
    const tr = document.createElement('tr');
    tr.className = 'empty-state-row';
    tr.innerHTML = `<td colspan="${colspan}" class="empty-state">${message}</td>`;
    tbody.appendChild(tr);
  }
}

function toggleListEmptyState(list, message) {
  const existingEmptyItem = list.querySelector('.empty-state-li');
  const hasRealItems = list.querySelectorAll('li:not(.empty-state-li)').length > 0;

  if (hasRealItems) {
    if (existingEmptyItem) existingEmptyItem.remove();
  } else if (!existingEmptyItem) {
    const li = document.createElement('li');
    li.className = 'empty-state-item empty-state-li';
    li.textContent = message;
    list.appendChild(li);
  }
}

  // Initial calculation on page load
  updateDashboardCounters();
  // Mark as complete logic lipat siya sa Vaccination records

function moveReminderToRecords(li) {
  const petName = li.querySelector('.pet-name')?.textContent.trim() || '';
  const eventType = li.querySelector('.event-type')?.textContent.trim() || '';

  const todayISO = new Date().toISOString().split('T')[0];
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const clone = recordRowTemplate.content.cloneNode(true);
  clone.querySelector('.record-pet').textContent = petName;
  clone.querySelector('.record-vaccine').textContent = eventType;

  const dateEl = clone.querySelector('.record-date');
  dateEl.setAttribute('datetime', todayISO);
  dateEl.textContent = todayFormatted;

  const statusEl = clone.querySelector('.status');
  statusEl.textContent = 'Completed';
  statusEl.setAttribute('data-status', 'completed');

  recordsBody.appendChild(clone);
  li.remove();
  updateDashboardCounters();
}

if (reminderList) {
  reminderList.querySelectorAll('.complete-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const li = btn.closest('li');
      moveReminderToRecords(li);
    });
  });
}
});
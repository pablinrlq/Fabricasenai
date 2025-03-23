const firebaseConfig = {
    apiKey: "AIzaSyDrZgPq-Pi1QzpNGyM52uy2oAoerZ8zNMw",
    authDomain: "senai-6f084.firebaseapp.com",
    projectId: "senai-6f084",
    storageBucket: "senai-6f084.firebasestorage.app",
    messagingSenderId: "892791288823",
    appId: "1:892791288823:web:e6b7b27f22f7981cc234f2"
};

const app = firebase.initializeApp(firebaseConfig);

var firebase;

document.addEventListener('DOMContentLoaded', function() {

    if (typeof firebase === 'undefined') {
        console.error('Firebase is not initialized. Make sure you have included the Firebase SDK.');
        return; 
    }

    firebase.auth().onAuthStateChanged(function(user) {
        if (!user) {
            window.location.href = 'admin-login.html';
            return;
        }

        initializeDashboard(user);
    });

    function initializeDashboard(user) {
        const adminName = document.getElementById('adminName');
        if (adminName) {
            adminName.textContent = user.email.split('@')[0] || 'Administrador';
        }

        const currentDateElement = document.getElementById('currentDate');
        if (currentDateElement) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            currentDateElement.textContent = new Date().toLocaleDateString('pt-BR', options);
        }

        initializeNavigation();
        loadAppointments();
        initializeModals();

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                firebase.auth().signOut().then(function() {
                    window.location.href = 'admin-login.html';
                }).catch(function(error) {
                    console.error('Erro ao fazer logout:', error);
                });
            });
        }
    }

    function initializeNavigation() {
        const navItems = document.querySelectorAll('.admin-nav-item');
        const views = document.querySelectorAll('.admin-view');

        navItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();

                navItems.forEach(navItem => navItem.classList.remove('active'));
                views.forEach(view => view.classList.remove('active'));

                this.classList.add('active');
                const viewId = this.getAttribute('data-view') + 'View';
                document.getElementById(viewId).classList.add('active');
            });
        });

        const filterBtn = document.querySelector('.filter-btn');
        const filterMenu = document.querySelector('.filter-menu');

        if (filterBtn && filterMenu) {
            filterBtn.addEventListener('click', function() {
                filterMenu.classList.toggle('active');
            });

            document.addEventListener('click', function(e) {
                if (!e.target.closest('.filter-dropdown')) {
                    filterMenu.classList.remove('active');
                }
            });

            const filterLinks = filterMenu.querySelectorAll('a');
            filterLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const filter = this.getAttribute('data-filter');
                    filterAppointments(filter);
                    filterMenu.classList.remove('active');

                    const filterText = this.textContent;
                    filterBtn.querySelector('span').textContent = filterText;
                });
            });
        }

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                searchAppointments(searchTerm);
            });
        }
    }

    function loadAppointments() {
        const db = firebase.firestore();
        const appointmentsTableBody = document.getElementById('appointmentsTableBody');

        if (!appointmentsTableBody) return;

        appointmentsTableBody.innerHTML = `
            <tr class="loading-row">
                <td colspan="6">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                        <span>Carregando agendamentos...</span>
                    </div>
                </td>
            </tr>
        `;

        db.collection('agendamentos')
            .orderBy('data', 'desc')
            .get()
            .then(function(querySnapshot) {

                appointmentsTableBody.innerHTML = '';

                let totalCount = 0;
                let todayCount = 0;
                let pendingCount = 0;
                let monthlyVisitorsCount = 0;

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const currentMonth = today.getMonth();
                const currentYear = today.getFullYear();

                window.allAppointments = [];

                if (querySnapshot.empty) {
                    appointmentsTableBody.innerHTML = `
                        <tr>
                            <td colspan="6" class="no-data">
                                <i class="fas fa-calendar-times"></i>
                                <p>Nenhum agendamento encontrado</p>
                            </td>
                        </tr>
                    `;
                } else {
                    querySnapshot.forEach(function(doc) {
                        const appointment = doc.data();
                        appointment.id = doc.id;

                        window.allAppointments.push(appointment);

                        const appointmentDate = parseDate(appointment.data);

                        totalCount++;

                        if (isSameDay(appointmentDate, today)) {
                            todayCount++;
                        }

                        if (appointment.status === 'pendente') {
                            pendingCount++;
                        }

                        if (appointmentDate.getMonth() === currentMonth && 
                            appointmentDate.getFullYear() === currentYear) {
                            monthlyVisitorsCount += Number(appointment.participantes);
                        }

                        const row = document.createElement('tr');
                        row.setAttribute('data-id', appointment.id);

                        const formattedDate = formatDate(appointment.data);

                        let statusClass = '';
                        let statusText = '';

                        switch(appointment.status) {
                            case 'confirmado':
                                statusClass = 'status-confirmed';
                                statusText = 'Confirmado';
                                break;
                            case 'cancelado':
                                statusClass = 'status-cancelled';
                                statusText = 'Cancelado';
                                break;
                            default:
                                statusClass = 'status-pending';
                                statusText = 'Pendente';
                        }

                        row.innerHTML = `
                            <td>${appointment.nome}</td>
                            <td>${formattedDate}</td>
                            <td>${appointment.horario}</td>
                            <td>${appointment.participantes}</td>
                            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                            <td>
                                <button class="action-btn view-btn" data-id="${appointment.id}">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="action-btn edit-btn" data-id="${appointment.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                            </td>
                        `;

                        appointmentsTableBody.appendChild(row);
                    });

                    addButtonEventListeners();
                }

                document.getElementById('totalAppointments').textContent = totalCount;
                document.getElementById('todayAppointments').textContent = todayCount;
                document.getElementById('pendingAppointments').textContent = pendingCount;
                document.getElementById('monthlyVisitors').textContent = monthlyVisitorsCount;
            })
            .catch(function(error) {
                console.error('Erro ao carregar agendamentos:', error);
                appointmentsTableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="error-message">
                            <i class="fas fa-exclamation-circle"></i>
                            <p>Erro ao carregar agendamentos. Tente novamente.</p>
                        </td>
                    </tr>
                `;
            });
    }

    function addButtonEventListeners() {
        const viewButtons = document.querySelectorAll('.view-btn');
        const editButtons = document.querySelectorAll('.edit-btn');

        viewButtons.forEach(button => {
            button.addEventListener('click', function() {
                const appointmentId = this.getAttribute('data-id');
                const appointment = window.allAppointments.find(a => a.id === appointmentId);
                if (appointment) {
                    openAppointmentModal(appointment, false);
                }
            });
        });

        editButtons.forEach(button => {
            button.addEventListener('click', function() {
                const appointmentId = this.getAttribute('data-id');
                const appointment = window.allAppointments.find(a => a.id === appointmentId);
                if (appointment) {
                    openAppointmentModal(appointment, true);
                }
            });
        });
    }

    function filterAppointments(filter) {
        if (!window.allAppointments) return;

        const appointmentsTableBody = document.getElementById('appointmentsTableBody');
        if (!appointmentsTableBody) return;

        appointmentsTableBody.innerHTML = '';

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const filteredAppointments = window.allAppointments.filter(appointment => {
            const appointmentDate = parseDate(appointment.data);

            switch(filter) {
                case 'today':
                    return isSameDay(appointmentDate, today);
                case 'week':
                    const weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - today.getDay());
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    return appointmentDate >= weekStart && appointmentDate <= weekEnd;
                case 'month':
                    return appointmentDate.getMonth() === today.getMonth() && 
                           appointmentDate.getFullYear() === today.getFullYear();
                case 'pending':
                    return appointment.status === 'pendente';
                case 'confirmed':
                    return appointment.status === 'confirmado';
                default:
                    return true; 
            }
        });

        if (filteredAppointments.length === 0) {
            appointmentsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data">
                        <i class="fas fa-calendar-times"></i>
                        <p>Nenhum agendamento encontrado com este filtro</p>
                    </td>
                </tr>
            `;
            return;
        }

        filteredAppointments.sort((a, b) => {
            const dateA = parseDate(a.data);
            const dateB = parseDate(b.data);
            return dateB - dateA;
        });

        filteredAppointments.forEach(appointment => {
            const row = document.createElement('tr');
            row.setAttribute('data-id', appointment.id);

            const formattedDate = formatDate(appointment.data);

            let statusClass = '';
            let statusText = '';

            switch(appointment.status) {
                case 'confirmado':
                    statusClass = 'status-confirmed';
                    statusText = 'Confirmado';
                case 'cancelado':
                    statusClass = 'status-cancelled';
                    statusText = 'Cancelado';
                default:
                    statusClass = 'status-pending';
                    statusText = 'Pendente';
            }

            row.innerHTML = `
                <td>${appointment.nome}</td>
                <td>${formattedDate}</td>
                <td>${appointment.horario}</td>
                <td>${appointment.participantes}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="action-btn view-btn" data-id="${appointment.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit-btn" data-id="${appointment.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;

            appointmentsTableBody.appendChild(row);
        });

        addButtonEventListeners();
    }

    function searchAppointments(searchTerm) {
        if (!window.allAppointments) return;

        const appointmentsTableBody = document.getElementById('appointmentsTableBody');
        if (!appointmentsTableBody) return;

        appointmentsTableBody.innerHTML = '';

        if (!searchTerm) {

            filterAppointments('all');
            return;
        }

        const filteredAppointments = window.allAppointments.filter(appointment => {
            return appointment.nome.toLowerCase().includes(searchTerm) ||
                   appointment.email.toLowerCase().includes(searchTerm) ||
                   appointment.motivo.toLowerCase().includes(searchTerm);
        });

        if (filteredAppointments.length === 0) {
            appointmentsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data">
                        <i class="fas fa-search"></i>
                        <p>Nenhum resultado encontrado para "${searchTerm}"</p>
                    </td>
                </tr>
            `;
            return;
        }

        filteredAppointments.forEach(appointment => {
            const row = document.createElement('tr');
            row.setAttribute('data-id', appointment.id);

            const formattedDate = formatDate(appointment.data);

            let statusClass = '';
            let statusText = '';

            switch(appointment.status) {
                case 'confirmado':
                    statusClass = 'status-confirmed';
                    statusText = 'Confirmado';
                case 'cancelado':
                    statusClass = 'status-cancelled';
                    statusText = 'Cancelado';
                default:
                    statusClass = 'status-pending';
                    statusText = 'Pendente';
            }

            row.innerHTML = `
                <td>${appointment.nome}</td>
                <td>${formattedDate}</td>
                <td>${appointment.horario}</td>
                <td>${appointment.participantes}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="action-btn view-btn" data-id="${appointment.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit-btn" data-id="${appointment.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;

            appointmentsTableBody.appendChild(row);
        });

        addButtonEventListeners();
    }

    function initializeModals() {

        const appointmentModal = document.getElementById('appointmentModal');
        const closeModalBtns = document.querySelectorAll('.close-modal');

        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });

        window.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        const saveAppointmentBtn = document.getElementById('saveAppointmentBtn');
        if (saveAppointmentBtn) {
            saveAppointmentBtn.addEventListener('click', function() {
                saveAppointmentChanges();
            });
        }

        const deleteAppointmentBtn = document.getElementById('deleteAppointmentBtn');
        if (deleteAppointmentBtn) {
            deleteAppointmentBtn.addEventListener('click', function() {
                deleteAppointment();
            });
        }
    }

function openAppointmentModal(appointment, editable) {
    const modal = document.getElementById('appointmentModal');
    if (!modal) {
        console.error("Modal element not found!");
        return;
    }

    console.log("Opening modal for appointment:", appointment);

    modal.setAttribute('data-id', appointment.id);

    document.getElementById('modalNome').textContent = appointment.nome;
    document.getElementById('modalEmail').textContent = appointment.email;
    document.getElementById('modalTelefone').textContent = appointment.telefone;
    document.getElementById('modalData').textContent = formatDate(appointment.data);
    document.getElementById('modalHorario').textContent = appointment.horario;
    document.getElementById('modalParticipantes').textContent = appointment.participantes;
    document.getElementById('modalMotivo').textContent = appointment.motivo;

    const statusSelect = document.getElementById('modalStatus');
    if (statusSelect) {
        statusSelect.value = appointment.status || 'pendente';
        statusSelect.disabled = !editable;
    }

    const observacoesTextarea = document.getElementById('modalObservacoes');
    if (observacoesTextarea) {
        observacoesTextarea.value = appointment.observacoes || '';
        observacoesTextarea.disabled = !editable;
    }

    const saveBtn = document.getElementById('saveAppointmentBtn');
    const deleteBtn = document.getElementById('deleteAppointmentBtn');

    if (saveBtn) {
        saveBtn.style.display = editable ? 'block' : 'none';
    }

    if (deleteBtn) {
        deleteBtn.style.display = editable ? 'block' : 'none';
    }

    modal.style.display = 'block';
    console.log("Modal display style set to:", modal.style.display);

    document.body.classList.add('modal-open');
}

    function saveAppointmentChanges() {
        const modal = document.getElementById('appointmentModal');
        if (!modal) return;

        const appointmentId = modal.getAttribute('data-id');
        if (!appointmentId) return;

        const status = document.getElementById('modalStatus').value;
        const observacoes = document.getElementById('modalObservacoes').value;

        const db = firebase.firestore();
        db.collection('agendamentos').doc(appointmentId).update({
            status,
            observacoes,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(function() {
            alert('Agendamento atualizado com sucesso!');
            modal.style.display = 'none';

            loadAppointments();
        })
        .catch(function(error) {
            console.error('Erro ao atualizar agendamento:', error);
            alert('Erro ao atualizar agendamento. Tente novamente.');
        });
    }

    function deleteAppointment() {
        const modal = document.getElementById('appointmentModal');
        if (!modal) return;

        const appointmentId = modal.getAttribute('data-id');
        if (!appointmentId) return;

        if (!confirm('Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.')) {
            return;
        }

        const db = firebase.firestore();
        db.collection('agendamentos').doc(appointmentId).delete()
            .then(function() {
                alert('Agendamento excluído com sucesso!');
                modal.style.display = 'none';

                loadAppointments();
            })
            .catch(function(error) {
                console.error('Erro ao excluir agendamento:', error);
                alert('Erro ao excluir agendamento. Tente novamente.');
            });
    }

    function parseDate(dateString) {

        const parts = dateString.split('-');
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }

    function formatDate(dateString) {

        const date = parseDate(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    function isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }
});
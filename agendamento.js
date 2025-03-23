document.addEventListener('DOMContentLoaded', function() {
    const firebaseConfig = {
        apiKey: "AIzaSyDrZgPq-Pi1QzpNGyM52uy2oAoerZ8zNMw",
        authDomain: "senai-6f084.firebaseapp.com",
        projectId: "senai-6f084",
        storageBucket: "senai-6f084.firebasestorage.app",
        messagingSenderId: "892791288823",
        appId: "1:892791288823:web:e6b7b27f22f7981cc234f2"
    };

    const app = firebase.initializeApp(firebaseConfig);

     const agendamentoForm = document.getElementById('agendamentoForm');
     const successMessage = document.getElementById('successMessage');
     const newAppointmentBtn = document.getElementById('newAppointmentBtn');
     const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
     const mobileMenu = document.querySelector('.mobile-menu');

     if (mobileMenuBtn) {
         mobileMenuBtn.addEventListener('click', function() {
             mobileMenu.classList.toggle('active');
         });
     }

     if (agendamentoForm) {
         agendamentoForm.addEventListener('submit', function(e) {
             e.preventDefault();

             const nome = document.getElementById('nome').value;
             const email = document.getElementById('email').value;
             const telefone = document.getElementById('telefone').value;
             const data = document.getElementById('data').value;
             const horario = document.getElementById('horario').value;
             const participantes = document.getElementById('participantes').value;
             const motivo = document.getElementById('motivo').value;

             const appointmentData = {
                 nome,
                 email,
                 telefone,
                 data,
                 horario,
                 participantes: Number(participantes),
                 motivo,
                 status: 'pendente', 
                 dataCriacao: firebase.firestore.FieldValue.serverTimestamp()
             };

             saveAppointmentToFirebase(appointmentData);
         });
     }

     if (newAppointmentBtn) {
         newAppointmentBtn.addEventListener('click', function() {

             successMessage.style.display = 'none';
             agendamentoForm.style.display = 'block';
             agendamentoForm.reset();
         });
     }

     function saveAppointmentToFirebase(appointmentData) {

         const db = firebase.firestore();

         db.collection('agendamentos').add(appointmentData)
             .then(function(docRef) {
                 console.log('Agendamento salvo com ID: ', docRef.id);

                 agendamentoForm.style.display = 'none';
                 successMessage.style.display = 'flex';
                 successMessage.classList.add('active');
             })
             .catch(function(error) {
                 console.error('Erro ao salvar agendamento: ', error);
                 alert('Ocorreu um erro ao agendar sua visita. Por favor, tente novamente.');
             });
     }

     const telefoneInput = document.getElementById('telefone');
     if (telefoneInput) {
         telefoneInput.addEventListener('input', function(e) {
             let value = e.target.value.replace(/\D/g, '');
             if (value.length > 11) value = value.slice(0, 11);

             if (value.length > 2) {
                 value = '(' + value.substring(0, 2) + ') ' + value.substring(2);
             }
             if (value.length > 10) {
                 value = value.substring(0, 10) + '-' + value.substring(10);
             }

             e.target.value = value;
         });
     }

     const dataInput = document.getElementById('data');
     if (dataInput) {
         const today = new Date();
         const dd = String(today.getDate()).padStart(2, '0');
         const mm = String(today.getMonth() + 1).padStart(2, '0');
         const yyyy = today.getFullYear();

         const minDate = yyyy + '-' + mm + '-' + dd;
         dataInput.setAttribute('min', minDate);
     }
});
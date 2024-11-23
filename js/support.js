// Inicializar emailjs
(function () {
    emailjs.init("0XQwJNyAAjiXpBsKf");
})();

// Función para enviar el correo
function sendEmail() {
    const submitBtn = document.getElementById('submitBtn');

    // Verificar si el botón está habilitado
    if (submitBtn.disabled) {
        return;
    }

    // Obtener los valores del formulario
    const userName = document.getElementById('userName').value;
    const userPhone = document.getElementById('userPhone').value;
    const userEmail = document.getElementById('userEmail').value;
    const userMessage = document.getElementById('userMessage').value;
    const helpType = document.getElementById('selectedOptionText').value;

    // Preparar los parámetros para emailjs
    const templateParams = {
        user_name: userName,
        user_phone: userPhone,
        user_email: userEmail,
        help_type: helpType,
        user_message: userMessage,
    };

    // Enviar el correo
    emailjs.send('service_puopivp', 'template_srxe9ai', templateParams)
        .then((response) => {
            console.log("Correo enviado exitosamente:", response.status, response.text);
            Swal.fire({
                title: 'Enviado',
                text: 'Tu formulario se ha enviado correctamente.',
                icon: 'success',
                confirmButtonText: 'Aceptar'
            }).then(() => {
                // Cerrar el modal
                $('#supportModal').modal('hide');
            });
        })
        .catch((error) => {
            console.error("Error al enviar el correo:", error);
            Swal.fire({
                title: 'Error',
                text: 'Hubo un problema al enviar el formulario.',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
        });
}

// Agregar el evento de envío al botón
document.getElementById('submitBtn').addEventListener('click', sendEmail);


// Función para mostrar el formulario correcto según la opción seleccionada
function toggleForm() {
    const supportOption = document.getElementById('supportOption').value;
    const plansForm = document.getElementById('plansForm');
    const supportForm = document.getElementById('supportForm');
    const commonFields = document.getElementById('commonFields');
    const selectedOption = document.getElementById('selectedOption');
    const selectedOptionText = document.getElementById('selectedOptionText');
    const planOptions = document.getElementById('planOptions');
    const helpType = document.getElementById('helpType');

    // Ocultar todos los formularios inicialmente
    plansForm.classList.add('d-none');
    supportForm.classList.add('d-none');
    commonFields.classList.add('d-none');
    selectedOption.classList.add('d-none');
    planOptions.classList.add('d-none');

    // Limpiar el tipo de ayuda (vacío por defecto)
    helpType.selectedIndex = 0;  // Asegurarse de que el "select" de tipo de ayuda esté vacío

    // Limpiar los radios de los planes
    const planRadios = document.querySelectorAll('input[name="plan"]');
    planRadios.forEach((radio) => {
        radio.checked = false;  // Desmarcar todos los radios de planes
    });

    // Limpiar el campo de texto que muestra el plan elegido
    selectedOptionText.value = '';
    selectedOption.classList.add('d-none');  // Ocultar campo de selección del plan

    // Mostrar el formulario correspondiente según la opción seleccionada
    if (supportOption === 'plan') {
        plansForm.classList.remove('d-none');
    } else if (supportOption === 'asistencia') {
        supportForm.classList.remove('d-none');
    }
}

// Función para mostrar el plan elegido o tipo de ayuda
function choosePlan(action) {
    const selectedOption = document.getElementById('selectedOption');
    const selectedOptionText = document.getElementById('selectedOptionText');
    const planOptions = document.getElementById('planOptions');
    const commonFields = document.getElementById('commonFields');

    // Mostrar las opciones de planes
    planOptions.classList.remove('d-none');
    selectedOption.classList.add('d-none');  // Ocultar campo de selección

    // Cambiar el texto según la acción (contratar o actualizar)
    const actionText = action === 'contratar' ? 'Contratar Plan:' : 'Actualizar Plan:';
    selectedOptionText.value = `${actionText} Elige un plan`;

    // Mostrar el formulario común solo después de que el plan haya sido elegido
    commonFields.classList.add('d-none');  // Asegurarnos que el formulario común no esté visible antes de elegir un plan

    // Limpiar cualquier selección previa de radio buttons de planes
    const planRadios = document.querySelectorAll('input[name="plan"]');
    planRadios.forEach((radio) => {
        radio.checked = false;  // Desmarcar todos los radios de planes
    });

    // Cambiar el estilo de los botones de "Contratar" y "Actualizar"
    const contratarButton = document.querySelector('.btn-primary');
    const actualizarButton = document.querySelector('.btn-secondary');

    // Eliminar la clase 'active' de ambos botones
    contratarButton.classList.remove('active');
    actualizarButton.classList.remove('active');

    // Añadir la clase 'active' al botón seleccionado
    if (action === 'contratar') {
        contratarButton.classList.add('active');
    } else if (action === 'actualizar') {
        actualizarButton.classList.add('active');
    }

    // Cuando se elige un plan, mostrar el plan elegido y el formulario común
    planRadios.forEach((radio) => {
        radio.addEventListener('change', function () {
            if (this.checked) {
                selectedOptionText.value = `${actionText} ${this.labels[0].textContent}`;
                selectedOption.classList.remove('d-none');  // Mostrar el campo con la opción elegida
                commonFields.classList.remove('d-none');  // Mostrar el formulario de datos del usuario
            }
        });
    });
}

// Función para actualizar el tipo de ayuda seleccionado (para asistencia técnica)
const helpType = document.getElementById('helpType');
helpType.addEventListener('change', function () {
    const selectedOption = document.getElementById('selectedOption');
    const selectedOptionText = document.getElementById('selectedOptionText');
    selectedOptionText.value = `Tipo de ayuda: ${this.options[this.selectedIndex].textContent}`;
    selectedOption.classList.remove('d-none');  // Mostrar el campo con la opción elegida

    // Mostrar el formulario común de datos del usuario después de elegir el tipo de ayuda
    const commonFields = document.getElementById('commonFields');
    commonFields.classList.remove('d-none');
});

// Función para validar el formulario
function validateForm() {
    const name = document.getElementById('userName');
    const phone = document.getElementById('userPhone');
    const email = document.getElementById('userEmail');
    const message = document.getElementById('userMessage');
    const formFields = [name, phone, email, message];
    let formValid = true;

    formFields.forEach(field => {
        if (!field.value.trim() || !field.checkValidity()) {
            field.classList.add('is-invalid');
            formValid = false;
        } else {
            field.classList.remove('is-invalid');
        }
    });

       // Validar el formato del correo electrónico
       if (!isValidEmail(email.value)) {
        email.classList.add('is-invalid');
        formValid = false;
    } else {
        email.classList.remove('is-invalid');
    }
    
    // Si todos los campos son válidos, habilitar el botón de envío
    if (formValid) {
        document.getElementById('submitBtn').disabled = false;
    } else {
        document.getElementById('submitBtn').disabled = true;
    }
}

// Limpiar el formulario cuando el modal se cierra
$('#supportModal').on('hidden.bs.modal', function () {
    // Resetear el formulario (campos de entrada)
    const planRadios = document.querySelectorAll('input[name="plan"]');
    planRadios.forEach((radio) => {
        radio.checked = false;  // Desmarcar todos los radios de planes
    });

    // Restablecer los campos de texto
    const selectedOptionText = document.getElementById('selectedOptionText');
    selectedOptionText.value = '';

    // Restablecer el select de tipo de soporte
    document.getElementById('supportOption').selectedIndex = 0;

    // Limpiar el campo de texto del plan seleccionado
    const selectedOption = document.getElementById('selectedOption');
    selectedOption.classList.add('d-none');  // Ocultar campo de selección del plan

    // Limpiar el formulario común
    const commonFields = document.getElementById('commonFields');
    commonFields.classList.add('d-none');

    // Limpiar el formulario de asistencia técnica
    const helpType = document.getElementById('helpType');
    helpType.selectedIndex = 0;  // Asegurarse de que el "select" de tipo de ayuda esté vacío

    // Eliminar cualquier clase 'active' de los botones
    const contratarButton = document.querySelector('.btn-primary');
    const actualizarButton = document.querySelector('.btn-secondary');
    contratarButton.classList.remove('active');
    actualizarButton.classList.remove('active');
});

// Validar en tiempo real
document.querySelectorAll('input,textarea').forEach(input => {
    input.addEventListener('input', validateForm);
});

// Habilitar el botón de envío cuando el formulario esté completo
window.addEventListener('load', validateForm);

// Agregar el evento de envío al botón
document.getElementById('submitBtn').addEventListener('click', sendEmail);

// Función para validar el formato del correo electrónico
function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}
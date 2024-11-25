import { auth, signInWithEmailAndPassword, updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential, sendEmailVerification, signOut } from './firebaseconfig.js';

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('changeEmailBtn').addEventListener('click', () => {
        document.getElementById('changeEmailModalBody').innerHTML = `
            <div class="mb-3">
                <label for="currentPasswordForEmail" class="form-label">Contraseña</label>
                <input type="password" class="form-control" id="currentPasswordForEmail" placeholder="Ingresa tu contraseña">
                <div id="currentPasswordForEmailError" class="text-danger d-none">Contraseña incorrecta</div>
            </div>
        `;
        document.getElementById('changeEmailModalFooter').innerHTML = `
            <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Cerrar</button>
            <button type="button" class="btn btn-primary" id="submitCurrentPasswordForEmail">Continuar</button>
        `;
        addCurrentPasswordForEmailListener();
    });

    document.getElementById('changePasswordBtn').addEventListener('click', () => {
        document.getElementById('changePasswordModalBody').innerHTML = `
            <div class="mb-3">
                <label for="currentPassword" class="form-label">Contraseña Actual</label>
                <input type="password" class="form-control" id="currentPassword" placeholder="Ingresa tu contraseña actual">
                <div id="currentPasswordError" class="text-danger d-none">Contraseña incorrecta</div>
            </div>
        `;
        document.getElementById('changePasswordModalFooter').innerHTML = `
            <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Cerrar</button>
            <button type="button" class="btn btn-primary" id="submitCurrentPassword">Continuar</button>
        `;
        addCurrentPasswordListener();
    });

    function addCurrentPasswordForEmailListener() {
        document.getElementById('submitCurrentPasswordForEmail').addEventListener('click', async () => {
            const currentPassword = document.getElementById('currentPasswordForEmail').value;
            try {
                const user = auth.currentUser;
                const credential = EmailAuthProvider.credential(user.email, currentPassword);
                await reauthenticateWithCredential(user, credential);
                document.getElementById('currentPasswordForEmailError').classList.add('d-none');
                document.getElementById('changeEmailModalBody').innerHTML = `
                    <div class="mb-3">
                        <label for="newEmail" class="form-label">Nuevo Correo Electrónico</label>
                        <input type="email" class="form-control" id="newEmail" placeholder="Ingresa tu nuevo correo electrónico">
                        <div id="emailError" class="text-danger d-none"></div>
                    </div>
                `;
                document.getElementById('changeEmailModalFooter').innerHTML = `
                    <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Cerrar</button>
                    <button type="button" class="btn btn-success" id="submitNewEmail">Cambiar correo</button>
                `;
                addNewEmailListener();
            } catch (error) {
                console.error('Error al validar la contraseña actual:', error);
                document.getElementById('currentPasswordForEmailError').textContent = 'Contraseña incorrecta';
                document.getElementById('currentPasswordForEmailError').classList.remove('d-none');
            }
        });
    }

    function addNewEmailListener() {
        document.getElementById('submitNewEmail').addEventListener('click', async () => {
            const newEmail = document.getElementById('newEmail').value;
            const emailError = document.getElementById('emailError');
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailPattern.test(newEmail)) {
                emailError.textContent = 'Por favor, ingresa un correo electrónico válido.';
                emailError.classList.remove('d-none');
                return;
            }

            try {
                await updateEmail(auth.currentUser, newEmail);
                await sendEmailVerification(auth.currentUser);
                Swal.fire({
                    icon: 'success',
                    title: 'Correo actualizado',
                    text: 'Tu correo electrónico se ha actualizado correctamente. Por favor, inicia sesión de nuevo.',
                    customClass: {
                        popup: 'swal-popup',
                        title: 'swal-title',
                        content: 'swal-text',
                        confirmButton: 'swal-btn'
                    }
                }).then(() => {
                    signOut(auth).then(() => {
                        localStorage.removeItem('userEmail');
                        window.location.href = '../pages/login.html';
                    }).catch((error) => {
                        console.error('Error al cerrar sesión:', error);
                    });
                });
                bootstrap.Modal.getInstance(document.getElementById('changeEmailModal')).hide();
            } catch (error) {
                console.error('Error al actualizar el correo electrónico:', error);
                emailError.textContent = 'Error al actualizar el correo electrónico';
                emailError.classList.remove('d-none');
            }
        });
    }

    function addCurrentPasswordListener() {
        document.getElementById('submitCurrentPassword').addEventListener('click', async () => {
            const currentPassword = document.getElementById('currentPassword').value;
            try {
                const user = auth.currentUser;
                const credential = EmailAuthProvider.credential(user.email, currentPassword);
                await reauthenticateWithCredential(user, credential);
                document.getElementById('currentPasswordError').classList.add('d-none');
                document.getElementById('changePasswordModalBody').innerHTML = `
                    <div class="mb-3">
                        <label for="newPassword" class="form-label">Nueva Contraseña</label>
                        <input type="password" class="form-control" id="newPassword" placeholder="Ingresa tu nueva contraseña">
                    </div>
                    <div class="mb-3">
                        <label for="confirmNewPassword" class="form-label">Confirmar Nueva Contraseña</label>
                        <input type="password" class="form-control" id="confirmNewPassword" placeholder="Confirma tu nueva contraseña">
                    </div>
                    <div id="passwordErrors" class="alert alert-danger d-none"></div>
                `;
                document.getElementById('changePasswordModalFooter').innerHTML = `
                    <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Cerrar</button>
                    <button type="button" class="btn btn-success" id="submitNewPassword">Actualizar Contraseña</button>
                `;
                addNewPasswordListeners();
            } catch (error) {
                console.error('Error al validar la contraseña actual:', error);
                document.getElementById('currentPasswordError').textContent = 'Contraseña incorrecta';
                document.getElementById('currentPasswordError').classList.remove('d-none');
            }
        });
    }

    function addNewPasswordListeners() {
        const newPasswordInput = document.getElementById('newPassword');
        const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
        const passwordErrors = document.getElementById('passwordErrors');

        function validatePasswords() {
            let errors = [];
            if (newPasswordInput.value.length < 6) {
                errors.push('La nueva contraseña debe tener al menos 6 caracteres');
            }
            if (newPasswordInput.value !== confirmNewPasswordInput.value) {
                errors.push('Las contraseñas no coinciden');
            }
            if (errors.length > 0) {
                passwordErrors.innerHTML = errors.join('<br>');
                passwordErrors.classList.remove('d-none');
            } else {
                passwordErrors.classList.add('d-none');
            }
        }

        newPasswordInput.addEventListener('input', validatePasswords);
        confirmNewPasswordInput.addEventListener('input', validatePasswords);

        document.getElementById('submitNewPassword').addEventListener('click', async () => {
            validatePasswords();
            if (!passwordErrors.classList.contains('d-none')) {
                return;
            }

            try {
                const user = auth.currentUser;
                await updatePassword(user, newPasswordInput.value);
                Swal.fire({
                    icon: 'success',
                    title: 'Contraseña actualizada',
                    text: 'Tu contraseña se ha actualizado correctamente.',
                    customClass: {
                        popup: 'swal-popup',
                        title: 'swal-title',
                        content: 'swal-text',
                        confirmButton: 'swal-btn'
                    }
                });
                bootstrap.Modal.getInstance(document.getElementById('changePasswordModal')).hide();
            } catch (error) {
                console.error('Error al actualizar la contraseña:', error);
                passwordErrors.textContent = 'Error al actualizar la contraseña';
                passwordErrors.classList.remove('d-none');
            }
        });
    }
});
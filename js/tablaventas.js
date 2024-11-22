import { auth, db, collection, query, where, getDocs } from './firebaseconfig.js';

$(document).ready(function () {
  const table = $("#inmueblesTable").DataTable();

  $("#inmuebleForm").on("submit", function (event) {
    event.preventDefault();

    const inmueble = $("#inmueble").val();
    const arrendatario = $("#arrendatario").val();
    const contacto = $("#contacto").val();
    const fechacobro = $("#fechacobro").val();
    const pago = $("#pago").val();
    const fincontrato = $("#fincontrato").val();

    table.row
      .add([
        inmueble,
        arrendatario,
        contacto,
        fechacobro,
        `$${pago}`,
        fincontrato,
        `<button class="btn btn-sm btn-warning"><i class="fas fa-edit"></i> Editar</button>
             <button class="btn btn-sm btn-danger"><i class="fas fa-trash"></i> Eliminar</button utton>`,
      ])
      .draw(false);

    $("#inmuebleForm")[0].reset();
    $("#addInmuebleModal").modal("hide");
  });
});



document.addEventListener('DOMContentLoaded', async () => {
    const inmuebleSelect = document.getElementById('inmueble');

    // Escuchar los cambios en el estado de autenticación
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                const q = query(
                    collection(db, "inmuebles"),
                    where("usuarioId", "==", user.uid)
                );
                const querySnapshot = await getDocs(q);

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const option = document.createElement('option');
                    option.value = data.nombre; // Usar el ID del inmueble
                    option.textContent = data.nombre; // Mostrar el nombre del inmueble
                    inmuebleSelect.appendChild(option);
                });
            } catch (error) {
                console.error("Error al cargar inmuebles:", error);
            }
        } else {
            console.warn("Usuario no autenticado. No se pueden cargar inmuebles.");
        }
    });
});

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

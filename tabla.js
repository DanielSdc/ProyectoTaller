$(document).ready(function() {

    const table = $('#inmueblesTable').DataTable();

    $('#inmuebleForm').on('submit', function(event) {
        event.preventDefault(); 

        const nombre = $('#nombre').val();
        const ubicacion = $('#ubicacion').val();
        const tamano = $('#tamano').val();
        const cuartos = $('#cuartos').val();
        const banos = $('#banos').val();
        const valor = $('#valor').val();
        const fotos = $('#fotos').val();

        table.row.add([
            nombre,
            ubicacion,
            `${tamano} m2`,
            cuartos,
            banos,
            `$${valor}`,
            fotos,
            `<button class="btn btn-sm btn-warning"><i class="fas fa-edit"></i> Editar</button>
             <button class="btn btn-sm btn-danger"><i class="fas fa-trash"></i> Eliminar</button>`
        ]).draw(false);

        $('#inmuebleForm')[0].reset();
        $('#addInmuebleModal').modal('hide');
    });
});
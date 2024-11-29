import { auth, db, collection, query, where, getDocs } from './firebaseconfig.js';

document.addEventListener('DOMContentLoaded', async () => {
    const ctx = document.getElementById('ingresosChart').getContext('2d');
    const ingresosPorMes = {};

    // Escuchar los cambios en el estado de autenticación
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                const reportesQuery = query(
                    collection(db, "reportes"),
                    where("usuarioId", "==", user.uid)
                );
                const inmueblesQuery = query(
                    collection(db, "inmuebles"),
                    where("usuarioId", "==", user.uid)
                );
                const rentasQuery = query(
                    collection(db, "rentas"),
                    where("usuarioId", "==", user.uid)
                );

                const [reportesSnapshot, inmueblesSnapshot, rentasSnapshot] = await Promise.all([
                    getDocs(reportesQuery),
                    getDocs(inmueblesQuery),
                    getDocs(rentasQuery)
                ]);

                let totalIncome = 0;
                const currentYear = new Date().getFullYear();
                reportesSnapshot.forEach((doc) => {
                    const data = doc.data();
                    const fechaPago = new Date(data.fechapago);
                    const mes = fechaPago.getMonth();
                    const anio = fechaPago.getFullYear();
                    const key = `${anio}-${mes}`;

                    if (!ingresosPorMes[key]) {
                        ingresosPorMes[key] = 0;
                    }
                    ingresosPorMes[key] += parseFloat(data.pago);

                    if (anio === currentYear) {
                        totalIncome += parseFloat(data.pago);
                    }
                });

                document.getElementById('totalIncome').textContent = `$${totalIncome.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} MXN`;

                document.getElementById('totalProperties').textContent = inmueblesSnapshot.size;

                document.getElementById('totalRentas').textContent = rentasSnapshot.size;

                // Generar la gráfica de ingresos
                const labels = Object.keys(ingresosPorMes).sort();
                const data = labels.map(label => ingresosPorMes[label]);

                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Ingresos por Mes',
                            data: data,
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            borderWidth: 1,
                            hoverBackgroundColor: 'rgba(75, 192, 192, 0.4)',
                            hoverBorderColor: 'rgba(75, 192, 192, 1)',
                            borderRadius: 5,
                            barPercentage: 0.5,
                            categoryPercentage: 0.5
                        }]
                    },
                    options: {
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(200, 200, 200, 0.2)',
                                    borderDash: [5, 5]
                                },
                                ticks: {
                                    color: '#333',
                                    font: {
                                        size: 14,
                                        weight: 'bold'
                                    }
                                },
                                title: {
                                    display: true,
                                    text: 'Ingresos (MXN)',
                                    color: '#333',
                                    font: {
                                        size: 16,
                                        weight: 'bold'
                                    }
                                }
                            },
                            x: {
                                grid: {
                                    display: false
                                },
                                ticks: {
                                    color: '#333',
                                    font: {
                                        size: 14,
                                        weight: 'bold'
                                    }
                                },
                                title: {
                                    display: true,
                                    text: 'Fechas',
                                    color: '#333',
                                    font: {
                                        size: 16,
                                        weight: 'bold'
                                    }
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: true,
                                labels: {
                                    color: '#333',
                                    font: {
                                        size: 16,
                                        weight: 'bold'
                                    }
                                }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                titleFont: {
                                    size: 16,
                                    weight: 'bold'
                                },
                                bodyFont: {
                                    size: 14
                                },
                                footerFont: {
                                    size: 12,
                                    style: 'italic'
                                },
                                cornerRadius: 5,
                                caretSize: 10,
                                xPadding: 10,
                                yPadding: 10
                            }
                        }
                    }
                });

                // Cargar imágenes del carrusel
                const carouselImages = document.getElementById('carouselImages');
                let isFirst = true;
                let imageGroup = [];
                inmueblesSnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (Array.isArray(data.fotos) && data.fotos.length > 0) {
                        data.fotos.forEach((fotoUrl) => {
                            imageGroup.push(fotoUrl);
                            if (imageGroup.length === 3) {
                                const div = document.createElement('div');
                                div.classList.add('carousel-item');
                                if (isFirst) {
                                    div.classList.add('active');
                                    isFirst = false;
                                }
                                div.innerHTML = `
                  <div class="row justify-content-center">
                    ${imageGroup.map(url => `
                      <div class="col-4">
                        <img src="${url}" class="d-block w-100 rounded-4 p-1 img-fluid" alt="Imagen">
                      </div>
                    `).join('')}
                  </div>
                `;
                                carouselImages.appendChild(div);
                                imageGroup = [];
                            }
                        });
                    }
                });

                // If there are remaining images that didn't form a complete group of 3
                if (imageGroup.length > 0) {
                    const div = document.createElement('div');
                    div.classList.add('carousel-item');
                    if (isFirst) {
                        div.classList.add('active');
                        isFirst = false;
                    }
                    div.innerHTML = `
            <div class="row justify-content-center">
              ${imageGroup.map(url => `
                <div class="col-4">
                  <img src="${url}" class="d-block w-100 rounded-4 p-1 img-fluid" alt="Imagen">
                </div>
              `).join('')}
            </div>
          `;
                    carouselImages.appendChild(div);
                }

                // If there are no images, display a message
                if (carouselImages.children.length === 0) {
                    const alertMessage = `
            <div class="alert alert-info" role="alert">
              No hay fotografías disponibles.
            </div>
          `;
                    document.querySelector('.elemento-inicio').insertAdjacentHTML('beforeend', alertMessage);

                    // Hide carousel controls
                    document.querySelector('.carousel-control-prev').style.display = 'none';
                    document.querySelector('.carousel-control-next').style.display = 'none';
                } else {
                    // Ensure the first item is active
                    carouselImages.firstElementChild.classList.add('active');
                }

                // Mostrar alertas de fechas próximas
                const fechasProximas = document.querySelector('.FechasProximas ul');
                fechasProximas.innerHTML = ''; // Limpiar la lista antes de agregar nuevas fechas

                rentasSnapshot.forEach((doc) => {
                    const data = doc.data();
                    const fechaCobro = new Date(data.fechacobro);
                    const finContrato = new Date(data.fincontrato);
                    const hoy = new Date();
                    const diasCobro = Math.ceil((fechaCobro - hoy) / (1000 * 60 * 60 * 24));
                    const diasContrato = Math.ceil((finContrato - hoy) / (1000 * 60 * 60 * 24));

                    if (diasCobro <= 7 && diasCobro >= 0) {
                        const li = document.createElement('li');
                        li.classList.add('py-2', 'px-3', 'mb-2', 'rounded', 'hover-animate');
                        li.textContent = `COBRO ${data.inmueble} EN ${diasCobro} DÍAS`;
                        if (diasCobro === 0) {
                            li.classList.add('bg-danger', 'text-white');
                        } else if (diasCobro < 3) {
                            li.classList.add('bg-warning', 'text-dark');
                        }
                        fechasProximas.appendChild(li);
                    }

                    if (diasContrato <= 7 && diasContrato >= 0) {
                        const li = document.createElement('li');
                        li.classList.add('py-2', 'px-3', 'mb-2', 'rounded', 'hover-animate');
                        li.textContent = `PLAZO CONTRATO ${data.inmueble} EN ${diasContrato} DÍAS`;
                        if (diasContrato === 0) {
                            li.classList.add('bg-danger', 'text-white');
                        } else if (diasContrato < 3) {
                            li.classList.add('bg-warning', 'text-dark');
                        }
                        fechasProximas.appendChild(li);
                    }
                });

            } catch (error) {
                console.error("Error al cargar reportes:", error);
            }
        } else {
            console.warn("Usuario no autenticado. No se pueden cargar reportes.");
        }
    });
});
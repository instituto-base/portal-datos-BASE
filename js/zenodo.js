fetch('https://zenodo.org/api/records/?communities=institutobase')
  .then(r => r.json())
  .then(data => {
    const div = document.getElementById('zenodo-datasets');

    // ❗ ESTA ES LA LÍNEA CLAVE (borra "Cargando...")
    div.innerHTML = "";

    data.hits.hits.forEach(d => {
      div.innerHTML += `
        <article>
          <h3>${d.metadata.title}</h3>
          <p>${d.metadata.description || ''}</p>
          <a href="${d.links.html}" target="_blank">Ver en Zenodo</a>
        </article>
      `;
    });
  })
  .catch(error => {
    const div = document.getElementById('zenodo-datasets');
    div.innerHTML = "Error cargando datasets";
    console.error(error);
  });

fetch(
  'https://api.gbif.org/v1/dataset/search?publishingOrg=29ef4f00-20db-41f8-b1ad-b5fd3c557c38'
)
  .then(r => r.json())
  .then(data => {
    const div = document.getElementById('gbif-datasets');

    data.results.forEach(d => {
      div.innerHTML += `
        <article>
          <h3>${d.title}</h3>
          <p>${d.description || ''}</p>
          <a href="https://www.gbif.org/dataset/${d.key}" target="_blank">
            Ver en GBIF
          </a>
        </article>
      `;
    });
  });

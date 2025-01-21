import * as L from 'https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js';

class WorldSteps extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.stops = [];
    this.map = null;
    this.preview = null;
    this.layers = []; // Store dynamically created map layers
  }

  connectedCallback() {
    this.render();
    this.initializeMap();
    this.loadStopsFromAttribute();

    // Vorschau-Element referenzieren
    this.preview = this.shadowRoot.querySelector('#preview');
    if (!this.preview) {
      console.error('Das Element mit der ID "preview" wurde nicht gefunden.');
    }
  }


  render() {
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        #map {
          height: 500px;
          border: 1px solid #ccc;
        }
        #steps-buttons {
          display: flex;
          gap: 20px;
          margin-left: 20px;
        }
        .steps-buttons-region {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .steps-buttons-region .btn {
          width: 100%;
          max-height: 22px;
          padding: 2px;
          font-size: 14px;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
        }
        .btn:hover, .leaflet-marker-icon:hover {
          transform: scale(1.1);
          background-color: #0056b3;
          color: white;
          transition: transform 0.2s, background-color 0.2s;
        }
        #content {
          margin-top: 20px;
        }
        #stop-title {
          font-size: 24px;
          font-weight: bold;
        }
        #preview {
          position: absolute;
          display: none;
          background: white;
          border: 1px solid #ccc;
          padding: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          z-index: 1000;
        }
        
        #content {
  margin-top: 20px;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  background: #f9f9f9;
  transition: background-color 0.3s, transform 0.3s;
}

#content:hover {
  background-color: #e9ecef;
  transform: scale(1.02);
}

#stop-title {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 10px;
  transition: opacity 0.3s;
}

#stop-description {
  font-size: 1.2rem;
  line-height: 1.6;
  color: #6c757d;
  transition: opacity 0.3s;
}
        
      </style>



      <div class="container">
        <div class="d-flex">
          <div id="map" style="flex: 1;"></div>
          <div id="steps-buttons"></div>
        </div>
 <div id="content" class="p-3 bg-light rounded shadow-sm">
  <h2 id="stop-title" class="text-primary"></h2>
  <hr />
  <p id="stop-description" class="text-muted"></p>
</div>
        <div id="preview"></div>
      </div>
    `;

  }

  initializeMap() {
    // Fix Leaflet default icon
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });



    this.map = L.map(this.shadowRoot.querySelector('#map')).setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);





  }




  showPreview(event, stop) {
    const preview = this.preview;

    // Prüfe, ob es sich um ein Leaflet-Event (Marker) oder ein normales MouseEvent handelt
    const mouseEvent = event.originalEvent || event;

    preview.style.display = 'block';
    preview.style.left = `${mouseEvent.pageX + 10}px`;
    preview.style.top = `${mouseEvent.pageY + 10}px`;
    preview.innerHTML = `
    <h5>${stop.name}</h5>
    <p>${stop.description}</p>
    <img src="${stop.preview}" alt="${stop.name}" style="max-width: 200px; max-height: 100px;">
  `;
  }



  hidePreview() {
    this.preview.style.display = 'none';
  }




  loadStopsFromAttribute() {
    const stopsAttr = this.getAttribute('stops');
    if (stopsAttr) {
      this.stops = JSON.parse(stopsAttr);
      this.updateStopsOnMap();
    }
  }

  setStops(stopsArray) {
    if (Array.isArray(stopsArray)) {
      this.stops = stopsArray;
      this.updateStopsOnMap();
    } else {
      console.error('Invalid stops data');
    }
  }

  updateStopsOnMap() {
    if (!this.map) return;

    // Clear previous layers
    this.layers.forEach(layer => this.map.removeLayer(layer));
    this.layers = [];

    const stopCoords = [];
    const stepsButtons = this.shadowRoot.querySelector('#steps-buttons');
    stepsButtons.innerHTML = '';

    const uniqueRegions = [...new Set(this.stops.map(stop => stop.region))];
    uniqueRegions.forEach(region => {
      const regionDiv = document.createElement('div');
      regionDiv.className = 'steps-buttons-region';
      stepsButtons.appendChild(regionDiv);

      const regionStops = this.stops.filter(stop => stop.region === region);
      regionStops.forEach(stop => {
        const marker = L.marker(stop.coords).addTo(this.map);
        marker.bindPopup(`<strong>${stop.name}</strong><br>${stop.description}`);

        // Klick-Event für Marker
        marker.on('click', () => {
          this.updateContent(stop.name, stop.description);
        });


        // Hover-Events für Marker
        marker.addEventListener('mouseover', (e) => this.showPreview(e, stop));
        marker.addEventListener('mouseout', () => this.hidePreview());

        this.layers.push(marker);

        const button = document.createElement('button');
        button.className = 'btn btn-primary';
        button.textContent = stop.name;
        button.addEventListener('click', () => {
          this.map.setView(stop.coords, 10);
        });

        // Klick-Event für Button
        button.addEventListener('click', () => {
          this.updateContent(stop.name, stop.description);
        });



        // Hover-Events für Button
        button.addEventListener('mouseover', (e) => this.showPreview(e, stop));
        button.addEventListener('mouseout', () => this.hidePreview());



        button.onclick = () => {
          this.map.setView(stop.coords, 10);
          this.updateContent(stop.name, stop.description);

          // Benutzerdefiniertes Event auslösen
          this.dispatchEvent(
            new CustomEvent('stopClicked', {
              detail: {
                name: stop.name,
                description: stop.description,
                coords: stop.coords,
                folder: stop.folder,
              },
              bubbles: true,
              composed: true,
            })
          );
        };

        regionDiv.appendChild(button);

        stopCoords.push(stop.coords);
      });
    });

    const polyline = L.polyline(stopCoords, { color: 'blue', weight: 3 }).addTo(this.map);
    this.layers.push(polyline);

    if (stopCoords.length) {
      this.map.fitBounds(L.latLngBounds(stopCoords));
    }
  }




  updateContent(name, description) {
    const titleElement = this.shadowRoot.querySelector('#stop-title');
    const descriptionElement = this.shadowRoot.querySelector('#stop-description');

    // Hinzufügen von Übergangseffekten
    titleElement.style.opacity = '0';
    descriptionElement.style.opacity = '0';

    setTimeout(() => {
      // Aktualisiere Inhalte nach kurzer Verzögerung
      titleElement.textContent = name;
      descriptionElement.textContent = description;

      // Sichtbarkeit wiederherstellen
      titleElement.style.opacity = '1';
      descriptionElement.style.opacity = '1';
    }, 200); // Verzögerung in Millisekunden
  }




}

customElements.define('world-steps', WorldSteps);

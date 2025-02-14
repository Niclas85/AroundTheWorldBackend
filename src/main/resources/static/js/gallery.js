
class Custom360Viewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            width: 100%;
            height: 100vh;
            position: relative;
          }
          #renderer-container {
            width: 100%;
            height: 100%;
          }
          .controls {
            position: absolute;
            top: 10px;
            left: 10px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          button {
            padding: 10px 15px;
            font-size: 14px;
            cursor: pointer;
            border: none;
            background-color: #007BFF;
            color: white;
            border-radius: 5px;
            transition: background-color 0.3s;
          }
          button:hover {
            background-color: #0056b3;
          }
          .gallery {
  display: flex;
  gap: 10px; /* Abstand zwischen den Elementen */
  flex-wrap: nowrap; /* Verhindert das Umbrechen auf mehrere Zeilen */
  overflow-x: auto; /* Aktiviert horizontales Scrollen */
  overflow-y: hidden; /* Deaktiviert vertikales Scrollen */
  scroll-behavior: smooth; /* Macht das Scrollen weicher */
}

        </style>
        <div id="renderer-container"></div>
        <div class="controls">
          <button id="zoomIn">Zoom In</button>
          <button id="zoomOut">Zoom Out</button>
          <button id="rotateLeft">Rotate Left</button>
          <button id="rotateRight">Rotate Right</button>
          <button id="rotateUp">Rotate Up</button>
          <button id="rotateDown">Rotate Down</button>
          <button id="reset">Reset View</button>
        </div>
      `;
  }

  connectedCallback() {
    this.mediaPath = this.getAttribute('media-path') || '';
    this.panorama3D = this.hasAttribute('panorama3d') && this.getAttribute('panorama3d') === 'true';

    if (!this.mediaPath) {
      console.error('Media path is required for Custom360Viewer component.');
      return;
    }
    this.init();
  }

  init() {
    this.loadMedia(this.mediaPath);
    this.setupButtons();
  }

  loadMedia(mediaPath) {
    const isVideo = mediaPath.endsWith('.mp4') || mediaPath.endsWith('.webm');
    const container = this.shadowRoot.getElementById('renderer-container');
    container.innerHTML = ''; // Clear previous content

    if (this.panorama3D) {
      if (isVideo) {
        this.initVideo3D(mediaPath);
      } else {
        this.init3DView(mediaPath);
      }
    } else {
      this.setupFlatView(mediaPath);
    }
  }

  init3DView(mediaPath) {
    const container = this.shadowRoot.getElementById('renderer-container');

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    container.appendChild(this.renderer.domElement);

    this.updateRendererSize(container);
    this.camera.position.set(0, 0, 0.1);

    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(mediaPath, () => {
      const geometry = new THREE.SphereGeometry(500, 60, 40);
      const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });

      this.sphere = new THREE.Mesh(geometry, material);
      this.scene.add(this.sphere);
      this.animate();
    });

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = true;

    // Zoom per Mausrad
    container.addEventListener('wheel', (event) => {
      if (event.deltaY < 0) {
        this.camera.position.z -= 2; // Zoom in
      } else {
        this.camera.position.z += 2; // Zoom out
      }
    });

    window.addEventListener('resize', () => this.updateRendererSize(container), false);
  }

  initVideo3D(mediaPath) {
    const container = this.shadowRoot.getElementById('renderer-container');

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    container.appendChild(this.renderer.domElement);

    this.updateRendererSize(container);
    this.camera.position.set(0, 0, 0.1);

    const video = document.createElement('video');
    video.src = mediaPath;
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.play();

    const videoTexture = new THREE.VideoTexture(video);
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    const material = new THREE.MeshBasicMaterial({ map: videoTexture, side: THREE.BackSide });

    this.sphere = new THREE.Mesh(geometry, material);
    this.scene.add(this.sphere);
    this.animate();

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = true;

    // Zoom per Mausrad
    container.addEventListener('wheel', (event) => {
      if (event.deltaY < 0) {
        this.camera.position.z -= 2; // Zoom in
      } else {
        this.camera.position.z += 2; // Zoom out
      }
    });

    window.addEventListener('resize', () => this.updateRendererSize(container), false);
  }


  setupFlatView(mediaPath) {
    const container = this.shadowRoot.getElementById('renderer-container');
    container.innerHTML = ''; // Clear previous content

    const isVideo = mediaPath.endsWith('.mp4') || mediaPath.endsWith('.webm');

    const scaleFactor = 1.1;  // How much to zoom per scroll event (can be adjusted)

    const zoomIn = () => {
      if (isVideo || container.querySelector('img')) {
        container.style.transform = `scale(${parseFloat(container.style.transform.slice(6)) * scaleFactor || 1})`;
      }
    };

    const zoomOut = () => {
      if (isVideo || container.querySelector('img')) {
        container.style.transform = `scale(${parseFloat(container.style.transform.slice(6)) / scaleFactor || 1})`;
      }
    };

    // Mousewheel event listener for zoom
    container.addEventListener('wheel', (event) => {
      if (event.deltaY < 0) {
        zoomIn(); // Zoom in on scroll up
      } else {
        zoomOut(); // Zoom out on scroll down
      }
    });

    if (isVideo) {
      const video = document.createElement('video');
      video.src = mediaPath;
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'contain';
      container.appendChild(video);
      video.play();
    } else {
      const img = document.createElement('img');
      img.src = mediaPath;
      img.alt = 'Bild';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'contain';
      container.appendChild(img);
    }
  }


  updateRendererSize(container) {
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  rotateCameraHorizontal(angle) {
    const offset = new THREE.Vector3();
    offset.copy(this.camera.position).sub(this.controls.target);

    const spherical = new THREE.Spherical();
    spherical.setFromVector3(offset);

    spherical.theta += angle;
    offset.setFromSpherical(spherical);
    this.camera.position.copy(this.controls.target).add(offset);

    this.camera.lookAt(this.controls.target);
  }

  rotateCameraVertical(angle) {
    const offset = new THREE.Vector3();
    offset.copy(this.camera.position).sub(this.controls.target);

    const spherical = new THREE.Spherical();
    spherical.setFromVector3(offset);

    spherical.phi += angle;
    spherical.phi = Math.max(0.01, Math.min(Math.PI - 0.01, spherical.phi));
    offset.setFromSpherical(spherical);
    this.camera.position.copy(this.controls.target).add(offset);

    this.camera.lookAt(this.controls.target);
  }

  setupButtons() {
    this.shadowRoot.getElementById('zoomIn').addEventListener('click', () => {
      this.camera.zoom *= 1.1;
      this.camera.updateProjectionMatrix();
    });

    this.shadowRoot.getElementById('zoomOut').addEventListener('click', () => {
      this.camera.zoom /= 1.1;
      this.camera.updateProjectionMatrix();
    });

    this.shadowRoot.getElementById('rotateLeft').addEventListener('click', () => {
      this.rotateCameraHorizontal(Math.PI / 8);
    });

    this.shadowRoot.getElementById('rotateRight').addEventListener('click', () => {
      this.rotateCameraHorizontal(-Math.PI / 8);
    });

    this.shadowRoot.getElementById('rotateUp').addEventListener('click', () => {
      this.rotateCameraVertical(Math.PI / 8);
    });

    this.shadowRoot.getElementById('rotateDown').addEventListener('click', () => {
      this.rotateCameraVertical(-Math.PI / 8);
    });

    this.shadowRoot.getElementById('reset').addEventListener('click', () => {
      this.controls.reset();
    });
  }
  setPanorama3D(value) {
    this.panorama3D = value;
    this.loadMedia(this.mediaPath);
  }

  changeMedia(newMediaPath) {
    console.log('Changing media to:', newMediaPath);
    this.mediaPath = newMediaPath;
    this.loadMedia(newMediaPath);
  }


  setupFlatViewControls() {
    const container = this.shadowRoot.getElementById('renderer-container');
    const mediaElement = this.mediaElement;

    this.shadowRoot.getElementById('zoomIn').addEventListener('click', () => {
      this.currentZoom *= 1.1;
      this.updateMediaTransform();
    });

    this.shadowRoot.getElementById('zoomOut').addEventListener('click', () => {
      this.currentZoom /= 1.1;
      this.updateMediaTransform();
    });

    this.shadowRoot.getElementById('rotateLeft').addEventListener('click', () => {
      this.currentX -= 20; // Move left
      this.updateMediaTransform();
    });

    this.shadowRoot.getElementById('rotateRight').addEventListener('click', () => {
      this.currentX += 20; // Move right
      this.updateMediaTransform();
    });

    this.shadowRoot.getElementById('rotateUp').addEventListener('click', () => {
      this.currentY -= 20; // Move up
      this.updateMediaTransform();
    });

    this.shadowRoot.getElementById('rotateDown').addEventListener('click', () => {
      this.currentY += 20; // Move down
      this.updateMediaTransform();
    });

    this.shadowRoot.getElementById('reset').addEventListener('click', () => {
      this.currentZoom = 1;
      this.currentX = 0;
      this.currentY = 0;
      this.updateMediaTransform();
    });
  }

  updateMediaTransform() {
    const mediaElement = this.mediaElement;
    mediaElement.style.transform = `translate(${this.currentX}px, ${this.currentY}px) scale(${this.currentZoom})`;
  }

}

customElements.define('custom-360-viewer', Custom360Viewer);





class GalleryComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.galleryItems = [];
    this.currentIndex = 0; // Zum Speichern des aktuellen Elements
    this.isGalleryVisible = true; // Galerie ist standardmäßig sichtbar
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        .gallery-container {
          position: relative;
          margin-bottom: 10px;
        }

        .gallery {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          transition: max-height 0.3s ease;
          overflow: hidden;
        }

        .hidden {
          max-height: 0;
          opacity: 0;
        }

        .gallery img {
          width: 120px;
          height: 120px;
          cursor: pointer;
          object-fit: cover;
          border: 2px solid transparent;
          border-radius: 8px;
          transition: border-color 0.3s;
        }

        .gallery img:hover {
          border-color: #007bff;
        }

        .toggle-button {
          position: absolute;
          top: -10px;
          right: -10px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
        }

        .toggle-button:hover {
          background-color: #0056b3;
        }

        .viewer {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .nav-buttons {
          position: absolute;
          top: 50%; /* Vertikal zentriert */
          transform: translateY(-50%);
          display: flex;
          justify-content: space-between;
          width: 100%; /* Buttons links und rechts */
          z-index: 10;
          pointer-events: none; /* Buttons blockieren keine Interaktionen mit dem Viewer */
        }

        .nav-buttons button {
          pointer-events: all; /* Aktiviert Interaktionen mit den Buttons */
          background-color: rgba(0, 0, 0, 0.5);
          color: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .nav-buttons button:hover {
          background-color: rgba(0, 0, 0, 0.8);
        }

        .nav-buttons .prev {
          margin-left: 10px;
        }

        .nav-buttons .next {
          margin-right: 10px;
        }
      </style>

      <div class="gallery-container">
        <button id="toggleGallery" class="toggle-button">▲</button>
        <div class="gallery"></div>
      </div>

      <div class="viewer">
        <div class="nav-buttons">
          <button id="prev" class="prev">◀</button>
          <button id="next" class="next">▶</button>
        </div>
        <custom-360-viewer id="360Viewer" media-path="black.png" panorama3d="true"></custom-360-viewer>
      </div>
    `;

    // Event-Listener für Buttons
    this.shadowRoot.getElementById('toggleGallery').addEventListener('click', () => this.toggleGallery());
    this.shadowRoot.getElementById('prev').addEventListener('click', () => this.showPrevious());
    this.shadowRoot.getElementById('next').addEventListener('click', () => this.showNext());
  }

  setGallery(gallery) {
    if (!Array.isArray(gallery) || gallery.some(item => typeof item !== 'object' || !item.src)) {
      console.error('Die übergebene Galerie ist ungültig. Sie muss eine Liste von Objekten mit einem "src"-Wert sein.');
      return;
    }
    this.galleryItems = gallery;
    this.loadGallery();
  }

  loadGallery() {
    const galleryContainer = this.shadowRoot.querySelector('.gallery');
    const viewer = this.shadowRoot.querySelector('custom-360-viewer');
    galleryContainer.innerHTML = ''; // Alte Inhalte entfernen

    this.galleryItems.forEach((item, index) => {
      const img = document.createElement('img');
      img.src = item.thumbnail;
      img.alt = item.alt;

      img.addEventListener('click', () => {
        this.currentIndex = index;
        viewer.setPanorama3D(item.panorama)
        viewer.changeMedia(item.src);
      //  viewer.setPanorama3D(item.type === '3DPic' || item.type === '3DVideo');
      });
      galleryContainer.appendChild(img);
    });
  }

  toggleGallery() {
    const gallery = this.shadowRoot.querySelector('.gallery');
    this.isGalleryVisible = !this.isGalleryVisible;
    gallery.classList.toggle('hidden', !this.isGalleryVisible);

    const toggleButton = this.shadowRoot.getElementById('toggleGallery');
    toggleButton.textContent = this.isGalleryVisible ? '▲' : '▼';
  }

  showPrevious() {
    if (this.galleryItems.length === 0) return;

    this.currentIndex = (this.currentIndex - 1 + this.galleryItems.length) % this.galleryItems.length;
    const viewer = this.shadowRoot.querySelector('custom-360-viewer');
    const item = this.galleryItems[this.currentIndex];
    viewer.changeMedia(item.src);
    viewer.setPanorama3D(item.panorama)
  }

  showNext() {
    if (this.galleryItems.length === 0) return;

    this.currentIndex = (this.currentIndex + 1) % this.galleryItems.length;
    const viewer = this.shadowRoot.querySelector('custom-360-viewer');
    const item = this.galleryItems[this.currentIndex];
    viewer.changeMedia(item.src);
    viewer.setPanorama3D(item.panorama)
  }
}

customElements.define('gallery-component', GalleryComponent);

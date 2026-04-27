document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // Three.js 3D Wireframe Background
    // ==========================================
    const initThreeJSBackground = () => {
        const container = document.getElementById('hero-3d-container');
        if (!container || typeof THREE === 'undefined') return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        
        // Use alpha:true to keep the background transparent
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        const buildingGroup = new THREE.Group();
        
        // Use the accent color #d4af37
        const material = new THREE.LineBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.5 }); 

        // Load the provided 3D model
        const loader = new THREE.GLTFLoader();
        loader.load('assets/Cladire.glb', (gltf) => {
            const model = gltf.scene;

            // Apply the wireframe material to all meshes in the model
            model.traverse((child) => {
                if (child.isMesh) {
                    const edges = new THREE.EdgesGeometry(child.geometry);
                    const line = new THREE.LineSegments(edges, material);
                    
                    // Keep the original local transforms of the mesh
                    line.position.copy(child.position);
                    line.quaternion.copy(child.quaternion);
                    line.scale.copy(child.scale);

                    buildingGroup.add(line);
                }
            });

            // Increase scale 5 times
            buildingGroup.scale.set(6, 6, 6);

            // Center the loaded model in the scene
            const box = new THREE.Box3().setFromObject(buildingGroup);
            const center = box.getCenter(new THREE.Vector3());
            buildingGroup.position.x += (buildingGroup.position.x - center.x);
            buildingGroup.position.y += (buildingGroup.position.y - center.y);
            buildingGroup.position.z += (buildingGroup.position.z - center.z);
            
        }, undefined, (error) => {
            console.error('An error happened loading the GLB model:', error);
        });
        
        scene.add(buildingGroup);
        camera.position.z = 12;

        // Animation Loop
        const animate = () => {
            requestAnimationFrame(animate);
            // Rotatie lenta panoramica in jurul arhitecturii
            buildingGroup.rotation.y += 0.002;
            renderer.render(scene, camera);
        };
        animate();

        // Handle resize
        window.addEventListener('resize', () => {
            if(container) {
                camera.aspect = container.clientWidth / container.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(container.clientWidth, container.clientHeight);
            }
        });
    };
    initThreeJSBackground();

    // ==========================================
    // Interactive Map Initialization (Leaflet.js)
    // ==========================================
    const initMap = () => {
        // Center of Bucharest roughly containing all 3 monuments
        const map = L.map('interactive-map').setView([44.4440, 26.0950], 13);

        // Dark elegant tiles (CartoDB Dark Matter)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        // Custom Gold HTML Marker icon
        const goldIcon = L.divIcon({
            className: 'custom-gold-marker',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
            popupAnchor: [0, -10]
        });

        // Monuments data
        const markers = [
            {
                coords: [44.4447, 26.0792], // Calea Griviței approx
                title: "Cinematograful Marconi",
                status: "Monument Istoric B-II-m-B-18890",
                link: "#monument-1" // We will add these IDs to the HTML
            },
            {
                coords: [44.4330, 26.0860], // Splaiul Independenței approx
                title: "Casa Pompiliu Eliade",
                status: "Monument Istoric B-II-m-B-21056",
                link: "#monument-2"
            },
            {
                coords: [44.4534, 26.1227], // Str. Silozului approx
                title: "Moara lui Assan",
                status: "Monument Istoric B-II-m-A-19692",
                link: "#monument-3"
            }
        ];

        // Add markers to map
        markers.forEach(monument => {
            const marker = L.marker(monument.coords, { icon: goldIcon }).addTo(map);
            
            // Popup HTML structure
            const popupContent = `
                <div>
                    <h4>${monument.title}</h4>
                    <p>${monument.status}</p>
                    <a href="${monument.link}" class="popup-btn">Vezi Reconstrucția »</a>
                </div>
            `;
            marker.bindPopup(popupContent);
        });
    };

    // Initialize map if container exists
    if(document.getElementById('interactive-map')) {
        initMap();
    }
    
    // ==========================================
    // Smooth scroll reveal observer
    // ==========================================
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.2
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    const monumentCards = document.querySelectorAll('.monument-card');
    monumentCards.forEach(card => {
        observer.observe(card);
    });


    // Image slider (Wipe focus) before/after logic
    const imageComparisons = document.querySelectorAll('.image-comparison');

    imageComparisons.forEach(container => {
        const slider = container.querySelector('.comparison-slider');
        const imageThen = container.querySelector('.image-then');
        
        // State
        let isDown = false;

        const moveSlider = (e) => {
            if (!isDown) return;
            e.preventDefault();

            // Get pointer X position relative to container
            let xFromContainer;
            
            if (e.type.includes('mouse')) {
                xFromContainer = e.clientX - container.getBoundingClientRect().left;
            } else if (e.type.includes('touch')) {
                xFromContainer = e.touches[0].clientX - container.getBoundingClientRect().left;
            }

            // constrain slider to container bounds
            const constrainX = Math.max(0, Math.min(xFromContainer, container.offsetWidth));
            
            // Calculate percentage
            const percentage = (constrainX / container.offsetWidth) * 100;
            
            // Apply percentage to slider line and image clip-path
            slider.style.left = `${percentage}%`;
            imageThen.style.clipPath = `polygon(0 0, ${percentage}% 0, ${percentage}% 100%, 0 100%)`;
        };

        // Mouse Events
        container.addEventListener('mousedown', (e) => {
            isDown = true;
            moveSlider(e);
        });
        
        window.addEventListener('mouseup', () => {
            isDown = false;
        });
        
        window.addEventListener('mousemove', moveSlider);

        // Touch Events
        container.addEventListener('touchstart', (e) => {
            isDown = true;
            moveSlider(e);
        }, { passive: false });
        
        window.addEventListener('touchend', () => {
            isDown = false;
        });
        
        window.addEventListener('touchmove', moveSlider, { passive: false });
        
        // Initialize at 50%
        imageThen.style.clipPath = `polygon(0 0, 50% 0, 50% 100%, 0 100%)`;
        slider.style.left = `50%`;
    });
});

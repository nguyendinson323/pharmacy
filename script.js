let map;
let markers = [];
let infoWindow;
let currentLanguage = 'en';
let filteredPharmacies = [...pharmacies];

// Language translations
const translations = {
    en: {
        'filters': 'Filters',
        '247-pharmacies': '24/7 Pharmacies',
        'open-sundays': 'Open on Sundays',
        'clear-filters': 'Clear Filters',
        'found-pharmacies': 'Found Pharmacies',
        'pharmacies': 'pharmacies',
        'pharmacy': 'pharmacy',
        'find-pharmacies': 'Find Pharmacies in Montenegro',
        'locate-error': 'Geolocation is not supported by this browser.',
        'locate-error-permission': 'Location access denied.',
        'locate-error-unavailable': 'Location information is unavailable.',
        'locate-error-timeout': 'Location request timed out.'
    },
    me: {
        'filters': 'Filteri',
        '247-pharmacies': '24/7 Apoteke',
        'open-sundays': 'Otvoreno Nedeljom',
        'clear-filters': 'Obriši Filtere',
        'found-pharmacies': 'Pronađene Apoteke',
        'pharmacies': 'apoteka',
        'pharmacy': 'apoteka',
        'find-pharmacies': 'Pronađite Apoteke u Crnoj Gori',
        'locate-error': 'Geolokacija nije podržana od strane ovog pretraživača.',
        'locate-error-permission': 'Pristup lokaciji je odbačen.',
        'locate-error-unavailable': 'Informacije o lokaciji nisu dostupne.',
        'locate-error-timeout': 'Zahtev za lokaciju je istekao.'
    }
};

// Initialize map
function initMap() {
    // Center on Podgorica
    const podgorica = { lat: 42.4411, lng: 19.2636 };

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        center: podgorica,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            },
            {
                featureType: 'transit',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    });

    infoWindow = new google.maps.InfoWindow();

    // Create markers for all pharmacies
    createMarkers();

    // Render pharmacy list
    renderPharmacyList();

    // Initialize event listeners
    initEventListeners();

    // Start banner rotation
    startBannerRotation();
}

// Create markers for pharmacies
function createMarkers() {
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    filteredPharmacies.forEach((pharmacy, index) => {
        const marker = new google.maps.Marker({
            position: { lat: pharmacy.lat, lng: pharmacy.lng },
            map: map,
            title: pharmacy.name,
            icon: {
                url: createCustomMarkerIcon(pharmacy),
                scaledSize: new google.maps.Size(32, 40),
                anchor: new google.maps.Point(16, 40)
            },
            animation: google.maps.Animation.DROP
        });

        marker.addListener('click', () => {
            showInfoWindow(marker, pharmacy);
            highlightPharmacyInList(index);
        });

        markers.push(marker);
    });
}

// Create custom marker icon based on pharmacy status
function createCustomMarkerIcon(pharmacy) {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');

    // Determine color based on status
    let color = '#2c5aa0'; // Default blue
    if (pharmacy.is247) {
        color = '#4caf50'; // Green for 24/7
    } else if (pharmacy.sundayOpen) {
        color = '#ff9800'; // Orange for Sunday open
    }

    // Draw marker shape
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, 2 * Math.PI);
    ctx.fill();

    // Draw pointer
    ctx.beginPath();
    ctx.moveTo(16, 30);
    ctx.lineTo(8, 20);
    ctx.lineTo(24, 20);
    ctx.closePath();
    ctx.fill();

    // Draw white center dot
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(16, 16, 6, 0, 2 * Math.PI);
    ctx.fill();

    return canvas.toDataURL();
}

// Show info window for selected pharmacy
function showInfoWindow(marker, pharmacy) {
    const hours = pharmacy.hours[currentLanguage];
    let badges = '';

    if (pharmacy.is247) {
        badges += '<span class="badge badge-247">24/7</span>';
    }
    if (pharmacy.sundayOpen) {
        badges += '<span class="badge badge-sunday">' +
                 (currentLanguage === 'en' ? 'Sunday' : 'Nedeljom') + '</span>';
    }

    const content = `
        <div class="custom-info-window">
            <div class="info-content">
                <div class="info-title">${pharmacy.name}</div>
                <div class="info-address"><i class="fas fa-map-marker-alt"></i> ${pharmacy.address}</div>
                <div class="info-hours"><i class="fas fa-clock"></i> ${hours}</div>
                ${badges ? `<div class="info-badges">${badges}</div>` : ''}
            </div>
        </div>
    `;

    infoWindow.setContent(content);
    infoWindow.open(map, marker);
}

// Render pharmacy list in sidebar
function renderPharmacyList() {
    const pharmacyList = document.getElementById('pharmacy-list');
    const resultsCount = document.getElementById('results-count');

    resultsCount.textContent = filteredPharmacies.length;

    pharmacyList.innerHTML = '';

    filteredPharmacies.forEach((pharmacy, index) => {
        const item = document.createElement('div');
        item.className = 'pharmacy-item';
        item.dataset.index = index;

        const hours = pharmacy.hours[currentLanguage];
        let badges = '';

        if (pharmacy.is247) {
            badges += '<span class="badge badge-247">24/7</span>';
        }
        if (pharmacy.sundayOpen) {
            badges += '<span class="badge badge-sunday">' +
                     (currentLanguage === 'en' ? 'Sunday' : 'Nedeljom') + '</span>';
        }

        item.innerHTML = `
            <div class="pharmacy-name">${pharmacy.name}</div>
            <div class="pharmacy-address">${pharmacy.address}</div>
            <div class="pharmacy-hours">${hours}</div>
            ${badges ? `<div class="pharmacy-badges">${badges}</div>` : ''}
        `;

        item.addEventListener('click', () => {
            const marker = markers[index];
            map.panTo(marker.getPosition());
            map.setZoom(15);
            showInfoWindow(marker, pharmacy);
            highlightPharmacyInList(index);
        });

        pharmacyList.appendChild(item);
    });
}

// Highlight selected pharmacy in list
function highlightPharmacyInList(index) {
    document.querySelectorAll('.pharmacy-item').forEach(item => {
        item.classList.remove('active');
    });

    const selectedItem = document.querySelector(`.pharmacy-item[data-index="${index}"]`);
    if (selectedItem) {
        selectedItem.classList.add('active');
    }
}

// Apply filters
function applyFilters() {
    const filter247 = document.getElementById('filter-247').checked;
    const filterSunday = document.getElementById('filter-sunday').checked;

    filteredPharmacies = pharmacies.filter(pharmacy => {
        if (filter247 && !pharmacy.is247) return false;
        if (filterSunday && !pharmacy.sundayOpen) return false;
        return true;
    });

    createMarkers();
    renderPharmacyList();

    // Adjust map bounds to show filtered markers
    if (filteredPharmacies.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        filteredPharmacies.forEach(pharmacy => {
            bounds.extend(new google.maps.LatLng(pharmacy.lat, pharmacy.lng));
        });
        map.fitBounds(bounds);
    }
}

// Clear all filters
function clearFilters() {
    document.getElementById('filter-247').checked = false;
    document.getElementById('filter-sunday').checked = false;
    applyFilters();
}

// Switch language
function switchLanguage(lang) {
    currentLanguage = lang;

    // Update active language button
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-lang="${lang}"]`).classList.add('active');

    // Update all text elements
    document.querySelectorAll('[data-en]').forEach(element => {
        element.textContent = element.getAttribute(`data-${lang}`);
    });

    // Re-render pharmacy list and markers
    renderPharmacyList();
    createMarkers();
}

// Change map type
function changeMapType(mapType) {
    map.setMapTypeId(mapType);

    // Update active tab
    document.querySelectorAll('.map-type-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-type="${mapType}"]`).classList.add('active');
}

// Initialize event listeners
function initEventListeners() {
    // Filter checkboxes
    document.getElementById('filter-247').addEventListener('change', applyFilters);
    document.getElementById('filter-sunday').addEventListener('change', applyFilters);

    // Clear filters button
    document.querySelector('.clear-filters').addEventListener('click', clearFilters);

    // Language switcher
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchLanguage(btn.dataset.lang);
        });
    });

    // Map type switcher
    document.querySelectorAll('.map-type-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const mapType = tab.dataset.type;
            changeMapType(mapType);
        });
    });

    // Locate user button
    document.getElementById('locate-btn').addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    map.setCenter(userLocation);
                    map.setZoom(15);

                    // Add user location marker
                    new google.maps.Marker({
                        position: userLocation,
                        map: map,
                        title: currentLanguage === 'en' ? 'Your Location' : 'Vaša Lokacija',
                        icon: {
                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
                                    <circle cx="10" cy="10" r="8" fill="#4285F4" stroke="white" stroke-width="2"/>
                                    <circle cx="10" cy="10" r="3" fill="white"/>
                                </svg>
                            `),
                            scaledSize: new google.maps.Size(20, 20),
                            anchor: new google.maps.Point(10, 10)
                        }
                    });
                },
                (error) => {
                    let message = translations[currentLanguage]['locate-error'];
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            message = translations[currentLanguage]['locate-error-permission'];
                            break;
                        case error.POSITION_UNAVAILABLE:
                            message = translations[currentLanguage]['locate-error-unavailable'];
                            break;
                        case error.TIMEOUT:
                            message = translations[currentLanguage]['locate-error-timeout'];
                            break;
                    }
                    alert(message);
                }
            );
        } else {
            alert(translations[currentLanguage]['locate-error']);
        }
    });
}

// Banner rotation
let currentBannerSlide = 0;
const bannerSlides = document.querySelectorAll('.banner-slide');
const bannerDots = document.querySelectorAll('.dot');

function showBannerSlide(index) {
    bannerSlides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
    });
    bannerDots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

function nextBannerSlide() {
    currentBannerSlide = (currentBannerSlide + 1) % bannerSlides.length;
    showBannerSlide(currentBannerSlide);
}

function startBannerRotation() {
    // Add click listeners to dots
    bannerDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentBannerSlide = index;
            showBannerSlide(currentBannerSlide);
        });
    });

    // Auto-rotate every 4 seconds
    setInterval(nextBannerSlide, 4000);
}

// Error handling for map load
window.initMap = initMap;
// Weather App with Geolocation
class WeatherApp {
    constructor() {
        this.apiKey = 'e4c72a6760c72b4fbb2e58244bc365cc'; // Replace with your actual API key
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
        this.oneCallBaseUrl = 'https://api.openweathermap.org/data/3.0';
        this.geoBaseUrl = 'https://api.openweathermap.org/geo/1.0';
        this.units = 'metric'; // 'metric' or 'imperial'
        this.theme = 'dark'; // 'dark' or 'light'
        this.favorites = JSON.parse(localStorage.getItem('weatherFavorites')) || [];
        this.currentLocation = null;
        this.init();
    }

    init() {
        this.loadSavedPreferences();
        this.setupEventListeners();
        this.checkLocationPermission();
    }

    loadSavedPreferences() {
        // Load saved theme
        const savedTheme = localStorage.getItem('weatherTheme');
        if (savedTheme) {
            this.theme = savedTheme;
            this.applyTheme();
        }
        
        // Load saved units
        const savedUnits = localStorage.getItem('weatherUnits');
        if (savedUnits) {
            this.units = savedUnits;
        }
    }

    applyTheme() {
        document.body.className = this.theme === 'dark' ? 
            'min-h-screen weather-gradient' : 
            'min-h-screen bg-gradient-to-br from-blue-400 to-blue-600';
        
        document.getElementById('themeToggle').innerHTML = this.theme === 'dark' ? 
            '<i class="fas fa-moon"></i>' : 
            '<i class="fas fa-sun"></i>';
    }

    setupEventListeners() {
        document.getElementById('getLocationBtn').addEventListener('click', () => this.requestLocation());
        document.getElementById('refreshBtn').addEventListener('click', () => this.refreshWeather());
        document.getElementById('retryBtn').addEventListener('click', () => this.requestLocation());
        document.getElementById('searchBtn').addEventListener('click', () => this.searchCity());
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchCity();
        });
        
        // New event listeners
        document.getElementById('unitToggle').addEventListener('click', () => this.toggleUnits());
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('favoriteBtn').addEventListener('click', () => this.toggleFavorite());
        document.getElementById('favoritesBtn').addEventListener('click', () => this.showFavorites());
        document.getElementById('mapsBtn').addEventListener('click', () => this.showWeatherMaps());
        document.getElementById('alertsBtn').addEventListener('click', () => this.showWeatherAlerts());
        
        // Close modals
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal')));
        });
    }

    checkLocationPermission() {
        if ('geolocation' in navigator) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                if (result.state === 'granted') {
                    this.requestLocation();
                }
            });
        } else {
            this.showError('Geolocation is not supported by your browser');
        }
    }

    requestLocation() {
        this.showLoading();
        
        if (!('geolocation' in navigator)) {
            this.showError('Geolocation is not supported by your browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => this.handleLocationSuccess(position),
            (error) => this.handleLocationError(error),
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            }
        );
    }

    handleLocationSuccess(position) {
        const { latitude, longitude } = position.coords;
        this.fetchWeatherByCoords(latitude, longitude);
    }

    handleLocationError(error) {
        let message = 'Unable to retrieve your location';
        
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message = 'Location access denied. Please enable location permissions.';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Location information is unavailable.';
                break;
            case error.TIMEOUT:
                message = 'Location request timed out.';
                break;
        }
        
        this.showError(message);
    }

    async fetchWeatherByCoords(lat, lon) {
        try {
            this.currentLocation = { lat, lon, name: null };
            
            // Fetch current weather, forecast, and alerts in parallel
            const [currentWeatherResponse, forecastResponse, alertsResponse] = await Promise.all([
                fetch(`${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${this.units}`),
                fetch(`${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${this.units}`),
                fetch(`${this.oneCallBaseUrl}/onecall?lat=${lat}&lon=${lon}&appid=${this.apiKey}&exclude=minutely,hourly,daily&units=${this.units}`)
            ]);
            
            if (!currentWeatherResponse.ok || !forecastResponse.ok) {
                throw new Error(`HTTP error! status: ${currentWeatherResponse.status || forecastResponse.status}`);
            }
            
            const currentData = await currentWeatherResponse.json();
            const forecastData = await forecastResponse.json();
            
            // Handle alerts (optional endpoint)
            let alertsData = null;
            if (alertsResponse.ok) {
                alertsData = await alertsResponse.json();
            }
            
            this.displayWeather(currentData);
            this.displayForecast(forecastData);
            this.updateFavoriteButton();
            
            if (alertsData && alertsData.alerts) {
                this.displayWeatherAlerts(alertsData.alerts);
            }
        } catch (error) {
            console.error('Error fetching weather:', error);
            if (error.message.includes('401')) {
                this.showError('Invalid API key. Please check your OpenWeatherMap API key.');
            } else {
                this.showError('Failed to fetch weather data. Please try again.');
            }
        }
    }

    async fetchWeatherByCity(city) {
        try {
            // Get coordinates first
            const geoResponse = await fetch(`${this.geoBaseUrl}/direct?q=${encodeURIComponent(city)}&limit=1&appid=${this.apiKey}`);
            
            if (!geoResponse.ok) {
                throw new Error(`HTTP error! status: ${geoResponse.status}`);
            }
            
            const geoData = await geoResponse.json();
            if (geoData.length === 0) {
                throw new Error('City not found');
            }
            
            const { lat, lon, name, country } = geoData[0];
            this.currentLocation = { lat, lon, name: `${name}, ${country}` };
            
            // Fetch current weather, forecast, and alerts in parallel
            const [currentWeatherResponse, forecastResponse, alertsResponse] = await Promise.all([
                fetch(`${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${this.units}`),
                fetch(`${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${this.units}`),
                fetch(`${this.oneCallBaseUrl}/onecall?lat=${lat}&lon=${lon}&appid=${this.apiKey}&exclude=minutely,hourly,daily&units=${this.units}`)
            ]);
            
            if (!currentWeatherResponse.ok || !forecastResponse.ok) {
                throw new Error(`HTTP error! status: ${currentWeatherResponse.status || forecastResponse.status}`);
            }
            
            const currentData = await currentWeatherResponse.json();
            const forecastData = await forecastResponse.json();
            
            // Handle alerts (optional endpoint)
            let alertsData = null;
            if (alertsResponse.ok) {
                alertsData = await alertsResponse.json();
            }
            
            this.displayWeather(currentData);
            this.displayForecast(forecastData);
            this.updateFavoriteButton();
            
            if (alertsData && alertsData.alerts) {
                this.displayWeatherAlerts(alertsData.alerts);
            }
        } catch (error) {
            console.error('Error fetching weather:', error);
            if (error.message === 'City not found') {
                this.showError('City not found. Please try a different city name.');
            } else if (error.message.includes('401')) {
                this.showError('Invalid API key. Please check your OpenWeatherMap API key.');
            } else {
                this.showError('Failed to fetch weather data. Please try again.');
            }
        }
    }

    displayWeather(data) {
        // Update location info
        document.getElementById('locationName').textContent = `${data.name}, ${data.sys.country}`;
        document.getElementById('locationCoords').textContent = `${data.coord.lat.toFixed(4)}°, ${data.coord.lon.toFixed(4)}°`;

        // Update current weather with unit conversion
        const tempUnit = this.units === 'metric' ? '°C' : '°F';
        const speedUnit = this.units === 'metric' ? 'm/s' : 'mph';
        
        document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}°`;
        document.getElementById('weatherDescription').textContent = data.weather[0].description;
        document.getElementById('feelsLike').textContent = `${Math.round(data.main.feels_like)}°`;
        document.getElementById('humidity').textContent = `${data.main.humidity}%`;
        document.getElementById('windSpeed').textContent = `${data.wind.speed} ${speedUnit}`;
        document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;

        // Update weather icon
        const iconCode = data.weather[0].icon;
        const iconElement = document.getElementById('weatherIcon');
        iconElement.className = `weather-icon fas ${this.getWeatherIcon(iconCode)}`;

        // Update additional info
        document.getElementById('sunrise').textContent = this.formatTime(data.sys.sunrise);
        document.getElementById('sunset').textContent = this.formatTime(data.sys.sunset);
        document.getElementById('visibility').textContent = `${(data.visibility / 1000).toFixed(1)} km`;
        document.getElementById('cloudiness').textContent = `${data.clouds.all}%`;

        // Show weather card
        this.showWeatherCard();
    }

    displayForecast(forecastData) {
        const forecastContainer = document.getElementById('forecastContainer');
        forecastContainer.innerHTML = '';

        // Process forecast data to get one forecast per day
        const dailyForecasts = this.processForecastData(forecastData);

        dailyForecasts.forEach((forecast, index) => {
            const forecastCard = this.createForecastCard(forecast, index);
            forecastContainer.appendChild(forecastCard);
        });
    }

    processForecastData(forecastData) {
        const dailyData = {};
        
        forecastData.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dateKey = date.toDateString();
            
            if (!dailyData[dateKey]) {
                dailyData[dateKey] = {
                    date: date,
                    temps: [],
                    weather: item.weather[0],
                    humidity: item.main.humidity,
                    windSpeed: item.wind.speed
                };
            }
            
            dailyData[dateKey].temps.push(item.main.temp);
        });

        // Get next 5 days (excluding today)
        const today = new Date().toDateString();
        return Object.values(dailyData)
            .filter(item => item.date.toDateString() !== today)
            .slice(0, 5)
            .map(item => ({
                date: item.date,
                highTemp: Math.max(...item.temps),
                lowTemp: Math.min(...item.temps),
                weather: item.weather,
                humidity: item.humidity,
                windSpeed: item.windSpeed
            }));
    }

    createForecastCard(forecast, index) {
        const card = document.createElement('div');
        card.className = 'bg-white/10 rounded-lg p-4 text-center text-white hover:bg-white/20 transition-all duration-300 fade-in';
        card.style.animationDelay = `${index * 0.1}s`;

        const dayName = forecast.date.toLocaleDateString('en-US', { weekday: 'short' });
        const dateNum = forecast.date.getDate();

        card.innerHTML = `
            <div class="font-semibold mb-2">${dayName}</div>
            <div class="text-sm text-white/70 mb-3">${dateNum}</div>
            <i class="fas ${this.getWeatherIcon(forecast.weather.icon)} text-3xl mb-3"></i>
            <div class="text-sm mb-2">${forecast.weather.description}</div>
            <div class="flex justify-center gap-2 text-sm">
                <span class="font-semibold">${Math.round(forecast.highTemp)}°</span>
                <span class="text-white/70">${Math.round(forecast.lowTemp)}°</span>
            </div>
            <div class="text-xs text-white/60 mt-2">
                <i class="fas fa-tint"></i> ${forecast.humidity}%
            </div>
        `;

        return card;
    }

    getWeatherIcon(iconCode) {
        const iconMap = {
            '01d': 'fa-sun text-yellow-300',
            '01n': 'fa-moon text-blue-200',
            '02d': 'fa-cloud-sun text-yellow-200',
            '02n': 'fa-cloud-moon text-blue-200',
            '03d': 'fa-cloud text-gray-300',
            '03n': 'fa-cloud text-gray-400',
            '04d': 'fa-cloud text-gray-400',
            '04n': 'fa-cloud text-gray-500',
            '09d': 'fa-cloud-showers-heavy text-blue-400',
            '09n': 'fa-cloud-showers-heavy text-blue-500',
            '10d': 'fa-cloud-sun-rain text-blue-300',
            '10n': 'fa-cloud-moon-rain text-blue-400',
            '11d': 'fa-bolt text-purple-400',
            '11n': 'fa-bolt text-purple-500',
            '13d': 'fa-snowflake text-blue-200',
            '13n': 'fa-snowflake text-blue-300',
            '50d': 'fa-smog text-gray-300',
            '50n': 'fa-smog text-gray-400'
        };
        
        return iconMap[iconCode] || 'fa-question text-gray-300';
    }

    formatTime(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    }

    searchCity() {
        const searchInput = document.getElementById('searchInput');
        const city = searchInput.value.trim();
        
        if (!city) {
            this.showError('Please enter a city name');
            return;
        }
        
        this.showLoading();
        this.fetchWeatherByCity(city);
        searchInput.value = '';
    }

    refreshWeather() {
        this.requestLocation();
    }

    showLoading() {
        this.hideAllCards();
        document.getElementById('loadingCard').classList.remove('hidden');
    }

    showWeatherCard() {
        this.hideAllCards();
        document.getElementById('weatherCard').classList.remove('hidden');
        document.getElementById('weatherCard').classList.add('fade-in');
    }

    showError(message) {
        this.hideAllCards();
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('errorCard').classList.remove('hidden');
        document.getElementById('errorCard').classList.add('fade-in');
    }

    hideAllCards() {
        document.getElementById('locationCard').classList.add('hidden');
        document.getElementById('loadingCard').classList.add('hidden');
        document.getElementById('weatherCard').classList.add('hidden');
        document.getElementById('errorCard').classList.add('hidden');
    }

    // New methods for enhanced features
    
    toggleUnits() {
        this.units = this.units === 'metric' ? 'imperial' : 'metric';
        localStorage.setItem('weatherUnits', this.units);
        
        document.getElementById('unitToggle').innerHTML = this.units === 'metric' ? 
            '<i class="fas fa-thermometer-half"></i> °C' : 
            '<i class="fas fa-thermometer-half"></i> °F';
        
        // Refresh current weather data with new units
        if (this.currentLocation) {
            this.fetchWeatherByCoords(this.currentLocation.lat, this.currentLocation.lon);
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('weatherTheme', this.theme);
        this.applyTheme();
    }

    toggleFavorite() {
        if (!this.currentLocation || !this.currentLocation.name) return;
        
        const locationName = this.currentLocation.name;
        const index = this.favorites.findIndex(fav => fav.name === locationName);
        
        if (index > -1) {
            this.favorites.splice(index, 1);
            this.showNotification('Removed from favorites');
        } else {
            this.favorites.push({
                name: locationName,
                lat: this.currentLocation.lat,
                lon: this.currentLocation.lon
            });
            this.showNotification('Added to favorites');
        }
        
        localStorage.setItem('weatherFavorites', JSON.stringify(this.favorites));
        this.updateFavoriteButton();
    }

    updateFavoriteButton() {
        if (!this.currentLocation || !this.currentLocation.name) return;
        
        const isFavorite = this.favorites.some(fav => fav.name === this.currentLocation.name);
        const btn = document.getElementById('favoriteBtn');
        
        if (isFavorite) {
            btn.innerHTML = '<i class="fas fa-heart"></i>';
            btn.classList.add('text-red-500');
        } else {
            btn.innerHTML = '<i class="far fa-heart"></i>';
            btn.classList.remove('text-red-500');
        }
    }

    showFavorites() {
        const modal = document.getElementById('favoritesModal');
        const container = document.getElementById('favoritesContainer');
        
        if (this.favorites.length === 0) {
            container.innerHTML = '<p class="text-white/70 text-center">No favorites added yet</p>';
        } else {
            container.innerHTML = this.favorites.map((fav, index) => `
                <div class="bg-white/10 rounded-lg p-4 flex justify-between items-center hover:bg-white/20 transition-all">
                    <div>
                        <h4 class="font-semibold text-white">${fav.name}</h4>
                        <p class="text-white/70 text-sm">${fav.lat.toFixed(4)}°, ${fav.lon.toFixed(4)}°</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="weatherApp.loadFavorite(${index})" class="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-white">
                            <i class="fas fa-cloud"></i>
                        </button>
                        <button onclick="weatherApp.removeFavorite(${index})" class="bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded text-white">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        modal.classList.remove('hidden');
    }

    loadFavorite(index) {
        const favorite = this.favorites[index];
        this.currentLocation = favorite;
        this.fetchWeatherByCoords(favorite.lat, favorite.lon);
        this.closeModal(document.getElementById('favoritesModal'));
    }

    removeFavorite(index) {
        this.favorites.splice(index, 1);
        localStorage.setItem('weatherFavorites', JSON.stringify(this.favorites));
        this.showFavorites();
        this.updateFavoriteButton();
    }

    showWeatherMaps() {
        if (!this.currentLocation) {
            this.showNotification('Please load weather data first');
            return;
        }
        
        const modal = document.getElementById('mapsModal');
        const mapContainer = document.getElementById('mapContainer');
        
        // Create weather map layers
        const mapTypes = [
            { name: 'Temperature', layer: 'temp_new', icon: 'fa-thermometer-half' },
            { name: 'Precipitation', layer: 'precipitation_new', icon: 'fa-cloud-rain' },
            { name: 'Wind', layer: 'wind_new', icon: 'fa-wind' },
            { name: 'Pressure', layer: 'pressure_new', icon: 'fa-compress-arrows-alt' }
        ];
        
        mapContainer.innerHTML = mapTypes.map(type => `
            <div class="bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-all cursor-pointer" onclick="weatherApp.openWeatherMap('${type.layer}')">
                <div class="text-center">
                    <i class="fas ${type.icon} text-3xl mb-2 text-white"></i>
                    <h4 class="font-semibold text-white">${type.name}</h4>
                    <p class="text-white/70 text-sm">View ${type.name.toLowerCase()} map</p>
                </div>
            </div>
        `).join('');
        
        modal.classList.remove('hidden');
    }

    openWeatherMap(layer) {
        if (!this.currentLocation) return;
        
        const { lat, lon } = this.currentLocation;
        const zoom = 10;
        const mapUrl = `https://openweathermap.org/weathermap?basemap=map&cities=true&layer=${layer}&lat=${lat}&lon=${lon}&zoom=${zoom}`;
        
        window.open(mapUrl, '_blank');
    }

    showWeatherAlerts() {
        if (!this.currentLocation) {
            this.showNotification('Please load weather data first');
            return;
        }
        
        const modal = document.getElementById('alertsModal');
        const alertsContainer = document.getElementById('alertsContainer');
        
        // Check if we have alerts data
        const alertsData = document.getElementById('weatherAlerts');
        
        if (!alertsData || alertsData.children.length === 0) {
            alertsContainer.innerHTML = '<p class="text-white/70 text-center">No weather alerts for this area</p>';
        } else {
            alertsContainer.innerHTML = alertsData.innerHTML;
        }
        
        modal.classList.remove('hidden');
    }

    displayWeatherAlerts(alerts) {
        const alertsContainer = document.getElementById('weatherAlerts');
        
        if (!alerts || alerts.length === 0) {
            alertsContainer.innerHTML = '';
            return;
        }
        
        alertsContainer.innerHTML = alerts.map(alert => `
            <div class="bg-yellow-500/20 border border-yellow-400/50 rounded-lg p-4 mb-3">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-semibold text-yellow-300">${alert.event}</h4>
                    <span class="text-yellow-200 text-sm">${new Date(alert.start * 1000).toLocaleDateString()}</span>
                </div>
                <p class="text-white/90 text-sm">${alert.description}</p>
                ${alert.sender_name ? `<p class="text-white/70 text-xs mt-2">Source: ${alert.sender_name}</p>` : ''}
            </div>
        `).join('');
        
        // Show alerts indicator
        const alertsBtn = document.getElementById('alertsBtn');
        alertsBtn.classList.add('text-yellow-400');
    }

    closeModal(modal) {
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-white/90 backdrop-blur-sm text-gray-800 px-6 py-3 rounded-lg shadow-lg z-50 fade-in';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});

// Demo mode for testing without API key
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeatherApp;
}

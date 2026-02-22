// Weather App with Geolocation
class WeatherApp {
    constructor() {
        this.apiKey = 'e4c72a6760c72b4fbb2e58244bc365cc'; // Replace with your actual API key
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkLocationPermission();
    }

    setupEventListeners() {
        document.getElementById('getLocationBtn').addEventListener('click', () => this.requestLocation());
        document.getElementById('refreshBtn').addEventListener('click', () => this.refreshWeather());
        document.getElementById('retryBtn').addEventListener('click', () => this.requestLocation());
        document.getElementById('searchBtn').addEventListener('click', () => this.searchCity());
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchCity();
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
            const response = await fetch(
                `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.displayWeather(data);
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
            const response = await fetch(
                `${this.baseUrl}/weather?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`
            );
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('City not found');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.displayWeather(data);
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

        // Update current weather
        document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}°`;
        document.getElementById('weatherDescription').textContent = data.weather[0].description;
        document.getElementById('feelsLike').textContent = `${Math.round(data.main.feels_like)}°`;
        document.getElementById('humidity').textContent = `${data.main.humidity}%`;
        document.getElementById('windSpeed').textContent = `${data.wind.speed} m/s`;
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
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});

// Demo mode for testing without API key
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeatherApp;
}

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
            // Fetch current weather and forecast in parallel
            const [currentWeatherResponse, forecastResponse] = await Promise.all([
                fetch(`${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`),
                fetch(`${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`)
            ]);
            
            if (!currentWeatherResponse.ok || !forecastResponse.ok) {
                throw new Error(`HTTP error! status: ${currentWeatherResponse.status || forecastResponse.status}`);
            }
            
            const currentData = await currentWeatherResponse.json();
            const forecastData = await forecastResponse.json();
            
            this.displayWeather(currentData);
            this.displayForecast(forecastData);
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
            // Fetch current weather and forecast in parallel
            const [currentWeatherResponse, forecastResponse] = await Promise.all([
                fetch(`${this.baseUrl}/weather?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`),
                fetch(`${this.baseUrl}/forecast?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`)
            ]);
            
            if (!currentWeatherResponse.ok || !forecastResponse.ok) {
                if (currentWeatherResponse.status === 404 || forecastResponse.status === 404) {
                    throw new Error('City not found');
                }
                throw new Error(`HTTP error! status: ${currentWeatherResponse.status || forecastResponse.status}`);
            }
            
            const currentData = await currentWeatherResponse.json();
            const forecastData = await forecastResponse.json();
            
            this.displayWeather(currentData);
            this.displayForecast(forecastData);
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
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});

// Demo mode for testing without API key
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeatherApp;
}

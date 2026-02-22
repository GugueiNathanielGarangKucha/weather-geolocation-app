# Weather App with Geolocation

A modern, responsive weather application that uses the browser's geolocation API to get real-time weather data for the user's current location.

## Features

- 🌍 **Automatic Geolocation**: Automatically detects user's location
- 🌤️ **Real-time Weather Data**: Displays current weather conditions
- 🔍 **City Search**: Search for weather in any city worldwide
- 📱 **Responsive Design**: Works perfectly on desktop and mobile devices
- 🎨 **Modern UI**: Beautiful glassmorphism design with smooth animations
- ⚡ **Fast Loading**: Optimized performance with loading states
- 🔄 **Refresh Functionality**: Easy weather data refresh
- 🌅 **Additional Info**: Sunrise, sunset, visibility, and more

## Technologies Used

- **HTML5**: Semantic markup
- **TailwindCSS**: Modern CSS framework
- **Vanilla JavaScript**: No framework dependencies
- **OpenWeatherMap API**: Weather data provider
- **Font Awesome**: Weather icons

## Setup Instructions

### 1. Get OpenWeatherMap API Key

1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Navigate to the "API keys" tab in your dashboard
4. Copy your API key

### 2. Configure the App

1. Open `script.js` in your code editor
2. Replace `YOUR_OPENWEATHERMAP_API_KEY` with your actual API key:

```javascript
this.apiKey = 'your_actual_api_key_here';
```

### 3. Run the App

Simply open `index.html` in your web browser. No build process required!

## Usage

### Automatic Location Detection

1. Open the app
2. Click "Get My Location" when prompted
3. Allow location access in your browser
4. View your local weather data

### Manual City Search

1. Type a city name in the search bar
2. Press Enter or click the search button
3. View weather data for that city

### Refresh Weather

Click the refresh button (↻) in the top-right corner of the weather card to update the current weather data.

## Browser Compatibility

This app works in all modern browsers that support:
- Geolocation API
- ES6 JavaScript
- CSS3 features

Supported browsers:
- ✅ Chrome (50+)
- ✅ Firefox (55+)
- ✅ Safari (11+)
- ✅ Edge (79+)

## Error Handling

The app includes comprehensive error handling for:
- Location permission denied
- Location unavailable
- Network errors
- Invalid API keys
- City not found
- API rate limits

## File Structure

```
weather-app/
├── index.html          # Main HTML file
├── script.js           # JavaScript functionality
├── README.md           # This file
└── assets/             # (if needed for future enhancements)
```

## API Rate Limits

Free OpenWeatherMap API plan includes:
- 60 calls/minute
- 1,000,000 calls/month

The app caches location data for 5 minutes to minimize API calls.

## Security Notes

- The API key is client-side (for demo purposes)
- For production, consider using a backend proxy
- Location data is only used for weather requests
- No data is stored or transmitted to third parties

## Future Enhancements

Potential features to add:
- 5-day weather forecast
- Weather maps
- Multiple location favorites
- Weather alerts
- Unit conversion (°F/°C)
- Dark/light theme toggle
- Offline support with service workers

## Troubleshooting

### Common Issues

1. **"Location access denied"**
   - Check browser location permissions
   - Try refreshing the page

2. **"Invalid API key" error**
   - Verify your OpenWeatherMap API key
   - Ensure the key is properly copied

3. **"City not found" error**
   - Check spelling of the city name
   - Try adding country code (e.g., "London,UK")

4. **App not loading**
   - Ensure all files are in the same directory
   - Check browser console for errors

## License

This project is open source and available under the [MIT License](LICENSE).

## Contributing

Feel free to submit issues and enhancement requests!

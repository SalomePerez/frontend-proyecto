export const environment = {
  production: false,
  
  // 🗺️ Token de Mapbox
  mapboxToken: 'pk.eyJ1IjoibmVsc29uYXBhY2hlIiwiYSI6ImNtYjF1Z25xMTBkZDIya3B4YzlmNHpkMGwifQ.nGrhOS2VtE91vmUrddz6XA',
  
  // 🌐 URLs de la API
  apiUrl: 'https://proyecto-avanzada.onrender.com/api',
  
  // 🔧 Configuración adicional - CAMBIO A ARMENIA
  defaultCity: 'ARMENIA',
  defaultCoordinates: {
    latitude: 4.5339,  // ← Coordenadas de Armenia
    longitude: -75.6811
  },
  
  // 📍 Configuración de geolocalización
  geolocation: {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 300000
  },
  
  // 🔍 Configuración de geocodificación
  geocoding: {
    mapboxGeocodingToken: 'pk.eyJ1IjoibmVsc29uYXBhY2hlIiwiYSI6ImNtYjF1Z25xMTBkZDIya3B4YzlmNHpkMGwifQ.nGrhOS2VtE91vmUrddz6XA'
  }
};

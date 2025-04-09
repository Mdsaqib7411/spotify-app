// Spotify API Configuration
const clientId = 'f568fbd5ea6649c4a0b07f7270e89646';
const redirectUri = 'https://spotifyclone7411.netlify.app/callback.html';

const authEndpoint = 'https://accounts.spotify.com/authorize';
const apiEndpoint = 'https://api.spotify.com/v1';

// Required Scopes
const scopes = [
  'user-read-private',
  'user-read-email',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'user-read-recently-played',
  'user-top-read',
  'playlist-read-private',
  'playlist-read-collaborative',
  'streaming'
].join(' ');

// DOM Elements
const loginContainer = document.getElementById('login-container');
const loginBtn = document.getElementById('login-btn');
const mainContainer = document.querySelector('.main');

// Global player reference
let spotifyPlayer = null;

// Check for access token on page load
document.addEventListener('DOMContentLoaded', initSpotify);

async function initSpotify() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const expiresIn = params.get('expires_in');
  const error = params.get('error');

  if (error) {
    showError(`Authentication error: ${error}`);
    return;
  }

  if (accessToken) {
    handleNewToken(accessToken, expiresIn);
  } else {
    checkExistingToken();
  }
}

function handleNewToken(accessToken, expiresIn) {
  // Store token and expiration
  localStorage.setItem('spotify_access_token', accessToken);
  localStorage.setItem('spotify_token_expiry', Date.now() + expiresIn * 1000);
  
  // Remove token from URL
  window.history.replaceState({}, document.title, window.location.pathname);
  
  // Initialize Spotify
  initializeSpotify(accessToken);
}

function checkExistingToken() {
  const token = localStorage.getItem('spotify_access_token');
  const expiryTime = localStorage.getItem('spotify_token_expiry');

  if (token && expiryTime && Date.now() < expiryTime) {
    initializeSpotify(token);
  } else {
    showLogin();
  }
}

function showLogin() {
  if (loginContainer) loginContainer.style.display = 'flex';
  if (mainContainer) mainContainer.style.display = 'none';
  
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      window.location.href = `${authEndpoint}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=token&show_dialog=true`;
    });
  }
}

function showError(message) {
  if (!loginContainer) return;
  
  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.textContent = message;
  loginContainer.appendChild(errorElement);
  console.error(message);
}

async function initializeSpotify(accessToken) {
  try {
    if (loginContainer) loginContainer.style.display = 'none';
    if (mainContainer) mainContainer.style.display = 'flex';
    
    // Initialize Web Playback SDK
    await loadSpotifySDK();
    
    spotifyPlayer = new Spotify.Player({
      name: 'Spotify Web Player',
      getOAuthToken: cb => { cb(accessToken); },
      volume: 0.5
    });

    setupPlayerEvents(spotifyPlayer);
    await spotifyPlayer.connect();
    
    // Load content
    await Promise.all([
      loadUserData(accessToken),
      loadFeaturedContent(accessToken)
    ]);
    
  } catch (error) {
    showError(`Initialization failed: ${error.message}`);
    console.error('Spotify initialization error:', error);
  }
}

// ... [rest of your existing functions remain the same] ...

// Fix for player control selector
function updatePlayPauseButton(state) {
  const playPauseBtn = document.querySelector('.player-control img[alt="Play/Pause"]');
  if (!playPauseBtn) return;
  
  if (state.paused) {
    playPauseBtn.src = "img/player_icon2.png";
    playPauseBtn.alt = "Play";
  } else {
    playPauseBtn.src = "img/player_icon3.png";
    playPauseBtn.alt = "Pause";
  }
}

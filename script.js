// Spotify API Configuration
const clientId = '26a6b497054a4853b8840fc54e5cb5b7'; // ALWAYS KEEP THIS SECURE
const redirectUri = window.location.href.includes('localhost') 
  ? 'http://localhost:3000/callback' 
  : 'https://github.com/Mdsaqib7411/spotify-app'
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
  loginContainer.style.display = 'flex';
  mainContainer.style.display = 'none';
  
  loginBtn.addEventListener('click', () => {
    window.location.href = `${authEndpoint}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=token&show_dialog=true`;
  });
}

function showError(message) {
  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.textContent = message;
  loginContainer.appendChild(errorElement);
  console.error(message);
}

async function initializeSpotify(accessToken) {
  try {
    loginContainer.style.display = 'none';
    mainContainer.style.display = 'flex';
    
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

function loadSpotifySDK() {
  return new Promise((resolve) => {
    if (window.Spotify) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.onload = () => {
      window.onSpotifyWebPlaybackSDKReady = resolve;
    };
    document.body.appendChild(script);
  });
}

function setupPlayerEvents(player) {
  player.addListener('ready', ({ device_id }) => {
    console.log('Player ready with device ID:', device_id);
    transferPlayback(device_id);
  });

  player.addListener('player_state_changed', state => {
    updatePlaybackState(state);
  });

  player.addListener('initialization_error', ({ message }) => {
    showError(`Player error: ${message}`);
  });

  player.addListener('authentication_error', ({ message }) => {
    showError(`Authentication error: ${message}`);
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_token_expiry');
    showLogin();
  });

  player.addListener('account_error', ({ message }) => {
    showError(`Account error: ${message}`);
  });

  player.addListener('playback_error', ({ message }) => {
    showError(`Playback error: ${message}`);
  });
}

async function transferPlayback(deviceId) {
  try {
    const response = await fetch(`${apiEndpoint}/me/player`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('spotify_access_token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        device_ids: [deviceId],
        play: false
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to transfer playback');
    }
  } catch (error) {
    console.error('Playback transfer error:', error);
  }
}

async function loadUserData(accessToken) {
  try {
    const [userData, recentTracks] = await Promise.all([
      fetchData(`${apiEndpoint}/me`, accessToken),
      fetchData(`${apiEndpoint}/me/player/recently-played?limit=6`, accessToken)
    ]);
    
    displayUserProfile(userData);
    displayRecentlyPlayed(recentTracks.items);
  } catch (error) {
    console.error('Error loading user data:', error);
  }
}

async function loadFeaturedContent(accessToken) {
  try {
    const [featuredPlaylists, newReleases] = await Promise.all([
      fetchData(`${apiEndpoint}/browse/featured-playlists?limit=6`, accessToken),
      fetchData(`${apiEndpoint}/browse/new-releases?limit=6`, accessToken)
    ]);
    
    displayFeaturedPlaylists(featuredPlaylists.playlists.items);
    displayNewReleases(newReleases.albums.items);
  } catch (error) {
    console.error('Error loading featured content:', error);
  }
}

async function fetchData(url, token) {
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
}

function displayUserProfile(user) {
  const userIcon = document.querySelector('.sticky-nav-option .fa-user');
  if (!userIcon) return;
  
  if (user.images?.length) {
    const profileImg = document.createElement('img');
    profileImg.src = user.images[0].url;
    profileImg.alt = `${user.display_name}'s profile`;
    profileImg.className = 'profile-image';
    userIcon.replaceWith(profileImg);
  }
}

function displayRecentlyPlayed(tracks) {
  updateCardSection('h2:first-of-type + .card-con', tracks, (track) => ({
    title: track.name,
    info: track.artists.map(a => a.name).join(', '),
    image: track.album.images[0]?.url,
    uri: track.uri
  }));
}

function displayFeaturedPlaylists(playlists) {
  updateCardSection('h2:nth-of-type(2) + .card-con', playlists, (playlist) => ({
    title: playlist.name,
    info: `By ${playlist.owner.display_name}`,
    image: playlist.images[0]?.url,
    uri: playlist.uri
  }));
}

function displayNewReleases(albums) {
  updateCardSection('h2:last-of-type + .card-con', albums, (album) => ({
    title: album.name,
    info: `By ${album.artists[0].name}`,
    image: album.images[0]?.url,
    uri: album.uri
  }));
}

function updateCardSection(selector, items, mapper) {
  const container = document.querySelector(selector);
  if (!container) return;
  
  container.innerHTML = '';
  items.forEach(item => {
    const data = mapper(item);
    if (data.image) { // Only add cards with valid images
      container.appendChild(createMusicCard(data));
    }
  });
}

function createMusicCard({ title, info, image, uri }) {
  const card = document.createElement('article');
  card.className = 'card';
  card.tabIndex = '0';
  
  const img = document.createElement('img');
  img.className = 'card-img';
  img.src = image;
  img.alt = `${title} cover`;
  img.loading = 'lazy';
  
  const titleEl = document.createElement('h3');
  titleEl.className = 'card-title';
  titleEl.textContent = title;
  
  const infoEl = document.createElement('p');
  infoEl.className = 'card-info';
  infoEl.textContent = info;
  
  card.append(img, titleEl, infoEl);
  card.addEventListener('click', () => playContent(uri));
  
  return card;
}

async function playContent(uri) {
  try {
    const token = localStorage.getItem('spotify_access_token');
    if (!token) throw new Error('No access token');
    
    const isTrack = uri.startsWith('spotify:track');
    const body = isTrack 
      ? JSON.stringify({ uris: [uri] })
      : JSON.stringify({ context_uri: uri });
    
    const response = await fetch(`${apiEndpoint}/me/player/play`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body
    });
    
    if (!response.ok) {
      throw new Error('Playback request failed');
    }
  } catch (error) {
    console.error('Error playing content:', error);
  }
}

function updatePlaybackState(state) {
  if (!state) return;
  
  updateProgressBar(state);
  updatePlayPauseButton(state);
  updateNowPlayingInfo(state);
}

function updateProgressBar(state) {
  const progressBar = document.querySelector('.progress-bar');
  if (!progressBar) return;
  
  const progress = state.duration ? (state.position / state.duration) * 100 : 0;
  progressBar.value = progress;
  
  const timeElements = document.querySelectorAll('.player-bar span');
  if (timeElements.length >= 2) {
    timeElements[0].textContent = formatTime(state.position / 1000);
    timeElements[1].textContent = formatTime(state.duration / 1000);
  }
}

function updatePlayPauseButton(state) {
  const playPauseBtn = document.querySelector('.player-controle img[alt="Play/Pause"]');
  if (!playPauseBtn) return;
  
  if (state.paused) {
    playPauseBtn.src = "img/player_icon2.png";
    playPauseBtn.alt = "Play";
  } else {
    playPauseBtn.src = "img/player_icon3.png";
    playPauseBtn.alt = "Pause";
  }
}

function updateNowPlayingInfo(state) {
  const track = state.track_window.current_track;
  const albumSection = document.querySelector('.album');
  if (!albumSection) return;
  
  // Update album cover
  let albumCover = albumSection.querySelector('img');
  if (!albumCover) {
    albumCover = document.createElement('img');
    albumCover.className = 'album-cover';
    albumSection.prepend(albumCover);
  }
  albumCover.src = track.album.images[0]?.url || '';
  albumCover.alt = `${track.name} album cover`;
  
  // Update track info
  let songInfo = albumSection.querySelector('.song-info');
  if (!songInfo) {
    songInfo = document.createElement('div');
    songInfo.className = 'song-info';
    albumSection.appendChild(songInfo);
  }
  songInfo.innerHTML = `
    <h3 class="song-title">${track.name}</h3>
    <p class="song-artist">${track.artists.map(a => a.name).join(', ')}</p>
  `;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
// Multi-Provider OAuth Registration System
(function(){
  const STORAGE_KEY = 'acloudresume_registered';
  const SHOW_DELAY = 3000;
  const API_BASE = 'https://ejlppub2ah.execute-api.us-east-1.amazonaws.com/prod';

  // OAuth Configuration for each provider
  const OAUTH_CONFIG = {
    google: {
      clientId: 'YOUR-GOOGLE-CLIENT-ID.apps.googleusercontent.com',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      scope: 'openid email profile',
      enabled: false // Set to true after setup
    },
    github: {
      clientId: 'YOUR-GITHUB-CLIENT-ID',
      authUrl: 'https://github.com/login/oauth/authorize',
      scope: 'read:user user:email',
      enabled: false // Set to true after setup
    },
    linkedin: {
      clientId: 'YOUR-LINKEDIN-CLIENT-ID',
      authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      scope: 'openid profile email',
      enabled: false // Set to true after setup
    }
  };

  function hasRegistered(){
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }

  function markRegistered(){
    localStorage.setItem(STORAGE_KEY, 'true');
  }

  async function fetchUserCount(){
    try{
      const res = await fetch(`${API_BASE}/auth/stats`);
      const data = await res.json();
      return data.totalUsers || 1247;
    }catch{
      return 1247;
    }
  }

  function createModal(){
    const modal = document.createElement('div');
    modal.id = 'register-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onclick="closeRegisterModal()"></div>
      <div class="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
        <button onclick="closeRegisterModal()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style="background: linear-gradient(135deg, #FF9900 0%, #232F3E 100%);">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <h2 class="text-2xl font-bold mb-2">Join Our Learning Community</h2>
          <p class="text-slate-600">Get access to exclusive tutorials, updates, and AWS resources</p>
        </div>

        <div class="space-y-3 mb-6">
          <button onclick="registerWith('google')" class="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition font-semibold">
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <button onclick="registerWith('github')" class="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition font-semibold">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Continue with GitHub
          </button>

          <button onclick="registerWith('linkedin')" class="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition font-semibold">
            <svg class="w-5 h-5" fill="#0A66C2" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            Continue with LinkedIn
          </button>
        </div>

        <div class="text-center">
          <p class="text-xs text-slate-500 mb-3">By registering, you agree to receive updates about new tutorials and AWS content.</p>
          <button onclick="closeRegisterModal()" class="text-sm text-slate-600 hover:underline">Maybe later</button>
        </div>

        <div class="mt-6 pt-6 border-t border-slate-200 text-center">
          <p class="text-sm text-slate-600">
            <span class="font-semibold" id="user-count">Loading...</span> developers already registered
          </p>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  function showRegisterModal(){
    const modal = document.getElementById('register-modal');
    if(modal){
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      
      fetchUserCount().then(count => {
        const countEl = document.getElementById('user-count');
        if(countEl) countEl.textContent = count.toLocaleString();
      });
    }
  }

  window.closeRegisterModal = function(){
    const modal = document.getElementById('register-modal');
    if(modal){
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  };

  window.registerWith = function(provider){
    const config = OAUTH_CONFIG[provider];
    
    if(!config || !config.enabled){
      alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth is not configured yet.\n\nTo enable:\n1. Create OAuth app in ${provider} developer console\n2. Update OAUTH_CONFIG in register.js\n3. Deploy backend with credentials\n\nSee OAUTH_SETUP.md for details.`);
      return;
    }
    
    const redirectUri = `${API_BASE}/auth/callback`;
    const state = provider;
    
    const authUrl = `${config.authUrl}?` +
      `client_id=${encodeURIComponent(config.clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(config.scope)}&` +
      `state=${state}`;
    
    window.location.href = authUrl;
  };

  // Check if returning from OAuth
  const urlParams = new URLSearchParams(window.location.search);
  if(urlParams.get('registered') === 'true'){
    markRegistered();
    
    setTimeout(() => {
      const modal = document.getElementById('register-modal');
      if(modal){
        showRegisterModal();
        modal.querySelector('.relative').innerHTML = `
          <div class="text-center py-8">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h2 class="text-2xl font-bold mb-2">Welcome Aboard! 🎉</h2>
            <p class="text-slate-600 mb-6">You're now part of our learning community.</p>
            <button onclick="closeRegisterModal()" class="px-6 py-3 rounded-xl text-white font-semibold" style="background: var(--aws-slate)">
              Start Learning
            </button>
          </div>
        `;
        setTimeout(() => {
          window.history.replaceState({}, document.title, window.location.pathname);
        }, 100);
      }
    }, 500);
  }

  document.addEventListener('DOMContentLoaded', function(){
    createModal();
    
    if(!hasRegistered() && !urlParams.get('registered')){
      setTimeout(showRegisterModal, SHOW_DELAY);
    }
    
    const registerBtn = document.getElementById('register-btn');
    if(registerBtn){
      registerBtn.addEventListener('click', showRegisterModal);
    }
  });

  const style = document.createElement('style');
  style.textContent = `
    @keyframes fade-in {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-fade-in {
      animation: fade-in 0.3s ease-out;
    }
  `;
  document.head.appendChild(style);
})();

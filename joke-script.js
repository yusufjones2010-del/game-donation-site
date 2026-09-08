// Joke Generator App
class JokeGenerator {
    constructor() {
        this.currentJoke = null;
        this.jokeCount = 0;
        this.favorites = JSON.parse(localStorage.getItem('jokeGrammarFavorites')) || [];
        this.apiUrl = 'https://official-joke-api.appspot.com';
        
        this.initElements();
        this.attachEventListeners();
        this.updateStats();
        this.renderFavorites();
    }
    
    initElements() {
        this.jokeDisplay = document.getElementById('jokeDisplay');
        this.getJokeBtn = document.getElementById('getJokeBtn');
        this.shareBtn = document.getElementById('shareBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.categorySelect = document.getElementById('category');
        this.jokeCountSpan = document.getElementById('jokeCount');
        this.favoriteCountSpan = document.getElementById('favoriteCount');
        this.favoritesList = document.getElementById('favoritesList');
        this.clearFavBtn = document.getElementById('clearFavBtn');
    }
    
    attachEventListeners() {
        this.getJokeBtn.addEventListener('click', () => this.getJoke());
        this.shareBtn.addEventListener('click', () => this.shareJoke());
        this.copyBtn.addEventListener('click', () => this.copyJoke());
        this.clearFavBtn.addEventListener('click', () => this.clearAllFavorites());
    }
    
    async getJoke() {
        this.getJokeBtn.disabled = true;
        this.jokeDisplay.innerHTML = '<p class="loading">⏳ Loading joke...</p>';
        
        try {
            const category = this.categorySelect.value;
            const endpoint = this.getEndpoint(category);
            
            const response = await fetch(`${this.apiUrl}${endpoint}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch joke');
            }
            
            const data = await response.json();
            this.currentJoke = this.formatJoke(data);
            this.jokeCount++;
            
            this.displayJoke();
            this.updateStats();
            this.showToast('Joke loaded!', 'success');
            
        } catch (error) {
            console.error('Error:', error);
            this.jokeDisplay.innerHTML = '<p style="color: #f44336;">❌ Failed to load joke. Please try again.</p>';
            this.showToast('Error loading joke', 'error');
        } finally {
            this.getJokeBtn.disabled = false;
        }
    }
    
    getEndpoint(category) {
        switch(category) {
            case 'general':
                return '/jokes/general/random';
            case 'programming':
                return '/jokes/programming/random';
            case 'knock-knock':
                return '/jokes/knock-knock/random';
            default:
                // Random between available categories
                const categories = ['general', 'programming', 'knock-knock'];
                const randomCat = categories[Math.floor(Math.random() * categories.length)];
                return this.getEndpoint(randomCat);
        }
    }
    
    formatJoke(data) {
        if (data.type === 'knock-knock') {
            return `${data.setup}... ${data.delivery}`;
        } else {
            return `${data.setup} ${data.delivery}`;
        }
    }
    
    displayJoke() {
        this.jokeDisplay.innerHTML = `<p class="joke-text">${this.currentJoke}</p>`;
        this.shareBtn.style.display = 'inline-block';
        this.copyBtn.style.display = 'inline-block';
    }
    
    shareJoke() {
        if (!this.currentJoke) return;
        
        const text = `Check out this joke: ${this.currentJoke}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Random Joke',
                text: text
            }).catch(err => console.log('Share cancelled'));
        } else {
            this.copyJoke();
            this.showToast('Copied to clipboard! Share it with your friends.', 'success');
        }
    }
    
    copyJoke() {
        if (!this.currentJoke) return;
        
        navigator.clipboard.writeText(this.currentJoke).then(() => {
            this.showToast('Joke copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Failed to copy:', err);
            this.showToast('Failed to copy', 'error');
        });
    }
    
    addToFavorites() {
        if (!this.currentJoke) return;
        
        if (!this.favorites.includes(this.currentJoke)) {
            this.favorites.push(this.currentJoke);
            localStorage.setItem('jokeGrammarFavorites', JSON.stringify(this.favorites));
            this.updateStats();
            this.renderFavorites();
            this.showToast('Added to favorites! ❤️', 'success');
        } else {
            this.showToast('Already in favorites!', 'success');
        }
    }
    
    removeFromFavorites(joke) {
        this.favorites = this.favorites.filter(j => j !== joke);
        localStorage.setItem('jokeGrammarFavorites', JSON.stringify(this.favorites));
        this.updateStats();
        this.renderFavorites();
        this.showToast('Removed from favorites', 'success');
    }
    
    clearAllFavorites() {
        if (this.favorites.length === 0) return;
        
        if (confirm('Are you sure you want to clear all favorites?')) {
            this.favorites = [];
            localStorage.setItem('jokeGrammarFavorites', JSON.stringify(this.favorites));
            this.updateStats();
            this.renderFavorites();
            this.showToast('All favorites cleared', 'success');
        }
    }
    
    renderFavorites() {
        if (this.favorites.length === 0) {
            this.favoritesList.innerHTML = '<p class="empty-favorites">No favorites yet. Add one!</p>';
            this.clearFavBtn.style.display = 'none';
            return;
        }
        
        this.favoritesList.innerHTML = this.favorites.map((joke, index) => `
            <div class="favorite-item">
                <p>${this.escapeHtml(joke)}</p>
                <button onclick="jokeApp.removeFromFavorites('${this.escapeJsString(joke)}')">Delete</button>
            </div>
        `).join('');
        
        this.clearFavBtn.style.display = 'inline-block';
    }
    
    updateStats() {
        this.jokeCountSpan.textContent = this.jokeCount;
        this.favoriteCountSpan.textContent = this.favorites.length;
    }
    
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
    
    escapeJsString(text) {
        return text.replace(/'/g, "\\'")
                   .replace(/"/g, '\\"')
                   .replace(/\n/g, '\\n')
                   .replace(/\r/g, '\\r');
    }
}

// Add favorite button to main display
document.addEventListener('DOMContentLoaded', () => {
    window.jokeApp = new JokeGenerator();
    
    // Add favorite button dynamically after joke display
    const jokeDisplay = document.getElementById('jokeDisplay');
    const observer = new MutationObserver(() => {
        if (jokeDisplay.querySelector('.joke-text')) {
            const existingBtn = document.getElementById('favBtn');
            if (!existingBtn) {
                const favBtn = document.createElement('button');
                favBtn.id = 'favBtn';
                favBtn.className = 'btn btn-secondary';
                favBtn.textContent = '❤️ Add to Favorites';
                favBtn.style.marginLeft = '0.5rem';
                favBtn.onclick = () => jokeApp.addToFavorites();
                
                const buttonGroup = document.querySelector('.button-group');
                const shareBtn = document.getElementById('shareBtn');
                shareBtn.after(favBtn);
            }
        }
    });
    
    observer.observe(jokeDisplay, { childList: true, subtree: true });
});
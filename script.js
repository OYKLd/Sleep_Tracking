class SleepTracker {
    constructor() {
        this.sleepData = this.loadFromStorage();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDate();
        this.updateStats();
        this.renderHistory();
    }

    setupEventListeners() {
        const form = document.getElementById('sleepForm');
        form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    setDefaultDate() {
        const dateInput = document.getElementById('date');
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
        dateInput.max = today;
    }

    handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const bedtime = formData.get('bedtime');
        const waketime = formData.get('waketime');
        const date = formData.get('date');

        if (!this.validateTimes(bedtime, waketime)) {
            this.showError('L\'heure de réveil doit être après l\'heure de coucher');
            return;
        }

        const sleepEntry = {
            id: Date.now(),
            date: date,
            bedtime: bedtime,
            waketime: waketime,
            duration: this.calculateDuration(bedtime, waketime, date),
            createdAt: new Date().toISOString()
        };

        this.addSleepEntry(sleepEntry);
        e.target.reset();
        this.setDefaultDate();
    }

    validateTimes(bedtime, waketime) {
        const bed = new Date(`2000-01-01T${bedtime}`);
        const wake = new Date(`2000-01-01T${waketime}`);
        
        if (wake > bed) {
            return true;
        }
        
        return false;
    }

    calculateDuration(bedtime, waketime, date) {
        const bedDateTime = new Date(`${date}T${bedtime}`);
        let wakeDateTime = new Date(`${date}T${waketime}`);
        
        if (wakeDateTime <= bedDateTime) {
            wakeDateTime.setDate(wakeDateTime.getDate() + 1);
        }

        const durationMs = wakeDateTime - bedDateTime;
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return { hours, minutes, totalMinutes: hours * 60 + minutes };
    }

    addSleepEntry(entry) {
        this.sleepData.unshift(entry);
        this.saveToStorage();
        this.updateStats();
        this.renderHistory();
        this.showSuccess('Nuit enregistrée avec succès !');
    }

    deleteSleepEntry(id) {
        this.sleepData = this.sleepData.filter(entry => entry.id !== id);
        this.saveToStorage();
        this.updateStats();
        this.renderHistory();
        this.showSuccess('Entrée supprimée');
    }

    updateStats() {
        const avgSleepEl = document.getElementById('avgSleep');
        const totalNightsEl = document.getElementById('totalNights');
        const lastNightEl = document.getElementById('lastNight');

        const totalNights = this.sleepData.length;
        totalNightsEl.textContent = totalNights;

        if (totalNights === 0) {
            avgSleepEl.textContent = '0h 00min';
            lastNightEl.textContent = '-';
            return;
        }

        const totalMinutes = this.sleepData.reduce((sum, entry) => 
            sum + entry.duration.totalMinutes, 0);
        const avgMinutes = Math.round(totalMinutes / totalNights);
        const avgHours = Math.floor(avgMinutes / 60);
        const avgMins = avgMinutes % 60;
        
        avgSleepEl.textContent = `${avgHours}h ${avgMins.toString().padStart(2, '0')}min`;

        const lastEntry = this.sleepData[0];
        const lastDuration = lastEntry.duration;
        lastNightEl.textContent = `${lastDuration.hours}h ${lastDuration.minutes.toString().padStart(2, '0')}min`;
    }

    renderHistory() {
        const historyList = document.getElementById('historyList');
        
        if (this.sleepData.length === 0) {
            historyList.innerHTML = '<p class="empty-message">Aucune nuit enregistrée pour le moment.</p>';
            return;
        }

        historyList.innerHTML = this.sleepData.map(entry => this.createHistoryItem(entry)).join('');
        
        historyList.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                this.deleteSleepEntry(id);
            });
        });
    }

    createHistoryItem(entry) {
        const { date, bedtime, waketime, duration, id } = entry;
        const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const durationClass = this.getDurationClass(duration.totalMinutes);
        const durationText = `${duration.hours}h ${duration.minutes.toString().padStart(2, '0')}min`;

        return `
            <div class="history-item">
                <div class="history-info">
                    <div class="history-date">${formattedDate}</div>
                    <div class="history-times">
                        <span>🌅 ${bedtime}</span>
                        <span>⏰ ${waketime}</span>
                        <span class="history-duration ${durationClass}">${durationText}</span>
                    </div>
                </div>
                <button class="btn-delete" data-id="${id}">🗑️ Supprimer</button>
            </div>
        `;
    }

    getDurationClass(minutes) {
        if (minutes >= 420) return 'duration-good';
        if (minutes >= 360) return 'duration-warning';
        return 'duration-danger';
    }

    saveToStorage() {
        localStorage.setItem('sleepData', JSON.stringify(this.sleepData));
    }

    loadFromStorage() {
        const stored = localStorage.getItem('sleepData');
        return stored ? JSON.parse(stored) : [];
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '1000',
            opacity: '0',
            transform: 'translateX(100%)',
            transition: 'all 0.3s ease'
        });

        if (type === 'success') {
            toast.style.background = '#10B981';
        } else if (type === 'error') {
            toast.style.background = '#EF4444';
        } else {
            toast.style.background = '#6B46C1';
        }

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SleepTracker();
});

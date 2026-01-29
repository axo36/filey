// ===== CONFIG SUPABASE =====
const SUPABASE_URL = "https://aziwyqlpcgkpcgkpcqjkv.supabase.co";
const SUPABASE_KEY = "sb_publishable_wRtZ50ROcD0VPxjZBO3sbg_WvDTNs_e";

const CLIENTS_TABLE = "clients";
const TELEPORTERS_TABLE = "teleporters";

const CLIENTS_URL = `${SUPABASE_URL}/rest/v1/${CLIENTS_TABLE}`;
const TELEPORTERS_URL = `${SUPABASE_URL}/rest/v1/${TELEPORTERS_TABLE}`;

console.log("✅ FILEY Site Web - Démarré");

let selectedClients = [];
let currentTeleporter = null;

// ===== NAVIGATION =====
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        
        // Update buttons
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update pages
        document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
        document.getElementById(`${page}-page`).classList.add('active');
        
        // Load data for the page
        if (page === 'dashboard') {
            loadClients();
        } else if (page === 'teleporters') {
            loadTeleporters();
        }
    });
});

// ===== LOAD CLIENTS =====
async function loadClients() {
    const grid = document.getElementById('clientsGrid');
    
    try {
        const response = await fetch(CLIENTS_URL + '?order=last_seen.desc', {
            headers: {
                "Authorization": `Bearer ${SUPABASE_KEY}`,
                "apikey": SUPABASE_KEY
            }
        });

        const clients = await response.json();
        
        if (!clients || clients.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🖥️</div>
                    <p>Aucun client connecté pour le moment</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = clients.map(client => {
            const lastSeen = new Date(client.last_seen);
            const now = new Date();
            const diffMinutes = Math.floor((now - lastSeen) / 1000 / 60);
            
            let timeText = '';
            if (diffMinutes < 1) {
                timeText = 'À l\'instant';
            } else if (diffMinutes < 60) {
                timeText = `Il y a ${diffMinutes} min`;
            } else {
                const hours = Math.floor(diffMinutes / 60);
                timeText = `Il y a ${hours}h`;
            }
            
            const isOnline = diffMinutes < 2;
            
            return `
                <div class="client-card">
                    <div class="client-header">
                        <div class="client-code">${client.code}</div>
                        ${isOnline ? `
                        <div class="client-status">
                            <span class="client-status-dot"></span>
                            <span>En ligne</span>
                        </div>
                        ` : ''}
                    </div>
                    <div class="client-user">
                        <span class="icon">👤</span>
                        <span>${client.username || 'Utilisateur'}</span>
                    </div>
                    <div class="client-screenshot" onclick="viewScreenshot('${client.screenshot_url || ''}')">
                        ${client.screenshot_url ? 
                            `<img src="${client.screenshot_url}" alt="Capture d'écran">` :
                            `<div class="placeholder">🖼️</div>`
                        }
                    </div>
                    <div class="client-time">${timeText}</div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error("❌ Erreur chargement clients:", error);
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <p>Erreur lors du chargement des clients</p>
            </div>
        `;
    }
}

// ===== VIEW SCREENSHOT =====
function viewScreenshot(url) {
    if (!url) return;
    window.open(url, '_blank');
}

// ===== LOAD TELEPORTERS =====
async function loadTeleporters() {
    const grid = document.getElementById('teleportersGrid');
    
    try {
        const response = await fetch(TELEPORTERS_URL + '?order=created_at.desc', {
            headers: {
                "Authorization": `Bearer ${SUPABASE_KEY}`,
                "apikey": SUPABASE_KEY
            }
        });

        const teleporters = await response.json();
        
        if (!teleporters || teleporters.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📡</div>
                    <p>Aucun téléporteur pour le moment</p>
                    <button class="btn-secondary" onclick="openCreateTeleporter()">Créer votre premier téléporteur</button>
                </div>
            `;
            return;
        }

        grid.innerHTML = teleporters.map(t => {
            const created = new Date(t.created_at);
            const dateText = created.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
            
            const targetCodes = t.target_codes ? JSON.parse(t.target_codes) : [];
            
            return `
                <div class="teleporter-card" onclick="viewTeleporter('${t.id}')">
                    <div class="teleporter-header">
                        <div>
                            <div class="teleporter-title">${t.name}</div>
                        </div>
                        <div class="teleporter-badge">Actif</div>
                    </div>
                    <div class="teleporter-description">${t.description || 'Aucune description'}</div>
                    <div class="teleporter-footer">
                        <div class="teleporter-targets">
                            <span>🎯</span>
                            <span>${targetCodes.length} client(s) ciblé(s)</span>
                        </div>
                        <div class="teleporter-date">${dateText}</div>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error("❌ Erreur chargement téléporteurs:", error);
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <p>Erreur lors du chargement des téléporteurs</p>
            </div>
        `;
    }
}

// ===== OPEN CREATE TELEPORTER MODAL =====
async function openCreateTeleporter() {
    const modal = document.getElementById('createTeleporterModal');
    const selector = document.getElementById('clientsSelector');
    
    modal.classList.add('show');
    selectedClients = [];
    
    // Reset form
    document.getElementById('teleporterName').value = '';
    document.getElementById('teleporterDescription').value = '';
    
    // Load clients for selection
    try {
        const response = await fetch(CLIENTS_URL + '?order=code.asc', {
            headers: {
                "Authorization": `Bearer ${SUPABASE_KEY}`,
                "apikey": SUPABASE_KEY
            }
        });

        const clients = await response.json();
        
        if (!clients || clients.length === 0) {
            selector.innerHTML = `
                <div class="empty-state small">
                    <p>Aucun client disponible</p>
                </div>
            `;
            return;
        }

        selector.innerHTML = clients.map(client => `
            <div class="client-checkbox-item" data-code="${client.code}" onclick="toggleClientSelection('${client.code}')">
                <div class="checkbox-custom"></div>
                <div class="client-checkbox-info">
                    <div class="client-checkbox-code">${client.code}</div>
                    <div class="client-checkbox-user">👤 ${client.username || 'Utilisateur'}</div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error("❌ Erreur chargement clients pour sélection:", error);
        selector.innerHTML = `
            <div class="empty-state small">
                <p>Erreur lors du chargement</p>
            </div>
        `;
    }
}

// ===== TOGGLE CLIENT SELECTION =====
function toggleClientSelection(code) {
    const item = document.querySelector(`[data-code="${code}"]`);
    
    if (selectedClients.includes(code)) {
        selectedClients = selectedClients.filter(c => c !== code);
        item.classList.remove('selected');
    } else {
        selectedClients.push(code);
        item.classList.add('selected');
    }
}

// ===== TOGGLE SELECT ALL =====
function toggleSelectAll() {
    const items = document.querySelectorAll('.client-checkbox-item');
    const allSelected = selectedClients.length === items.length;
    
    if (allSelected) {
        selectedClients = [];
        items.forEach(item => item.classList.remove('selected'));
    } else {
        selectedClients = [];
        items.forEach(item => {
            const code = item.dataset.code;
            selectedClients.push(code);
            item.classList.add('selected');
        });
    }
}

// ===== CREATE TELEPORTER =====
async function createTeleporter() {
    const name = document.getElementById('teleporterName').value.trim();
    const description = document.getElementById('teleporterDescription').value.trim();
    
    if (!name) {
        alert('❌ Veuillez entrer un nom pour le téléporteur');
        return;
    }
    
    if (selectedClients.length === 0) {
        alert('❌ Veuillez sélectionner au moins un client');
        return;
    }
    
    const data = {
        name: name,
        description: description,
        target_codes: JSON.stringify(selectedClients),
        status: 'active'
    };
    
    try {
        const response = await fetch(TELEPORTERS_URL, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${SUPABASE_KEY}`,
                "apikey": SUPABASE_KEY,
                "Prefer": "return=representation"
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Erreur création');
        }

        const result = await response.json();
        console.log("✅ Téléporteur créé:", result);
        
        closeCreateTeleporter();
        loadTeleporters();
        
        // Show success message
        alert(`✅ Téléporteur "${name}" créé avec succès!\n\n${selectedClients.length} client(s) ciblé(s)`);
        
    } catch (error) {
        console.error("❌ Erreur création téléporteur:", error);
        alert('❌ Erreur lors de la création du téléporteur');
    }
}

// ===== CLOSE CREATE TELEPORTER MODAL =====
function closeCreateTeleporter() {
    document.getElementById('createTeleporterModal').classList.remove('show');
    selectedClients = [];
}

// ===== VIEW TELEPORTER =====
async function viewTeleporter(id) {
    try {
        const response = await fetch(TELEPORTERS_URL + `?id=eq.${id}`, {
            headers: {
                "Authorization": `Bearer ${SUPABASE_KEY}`,
                "apikey": SUPABASE_KEY
            }
        });

        const data = await response.json();
        if (!data || data.length === 0) return;
        
        const teleporter = data[0];
        currentTeleporter = teleporter;
        
        const modal = document.getElementById('teleporterDetailsModal');
        document.getElementById('detailsTitle').textContent = teleporter.name;
        document.getElementById('detailsDescription').textContent = teleporter.description || 'Aucune description';
        
        const created = new Date(teleporter.created_at);
        document.getElementById('detailsCreated').textContent = created.toLocaleString('fr-FR');
        
        const targetCodes = teleporter.target_codes ? JSON.parse(teleporter.target_codes) : [];
        document.getElementById('detailsTargets').textContent = targetCodes.join(', ');
        
        // Generate teleporter link
        const baseUrl = window.location.origin + window.location.pathname.replace('index.html', '');
        const teleporterUrl = `${baseUrl}teleporter.html?id=${teleporter.id}`;
        document.getElementById('teleporterLink').value = teleporterUrl;
        
        modal.classList.add('show');
        
    } catch (error) {
        console.error("❌ Erreur chargement détails téléporteur:", error);
    }
}

// ===== CLOSE TELEPORTER DETAILS MODAL =====
function closeTeleporterDetails() {
    document.getElementById('teleporterDetailsModal').classList.remove('show');
    currentTeleporter = null;
}

// ===== COPY TELEPORTER LINK =====
function copyTeleporterLink() {
    const input = document.getElementById('teleporterLink');
    input.select();
    document.execCommand('copy');
    
    const btn = event.target.closest('.btn-copy');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<span class="icon">✓</span>';
    
    setTimeout(() => {
        btn.innerHTML = originalHTML;
    }, 2000);
}

// ===== CLOSE MODALS ON OUTSIDE CLICK =====
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
});

// ===== INITIALIZE =====
loadClients();
setInterval(loadClients, 5000); // Refresh every 5 seconds

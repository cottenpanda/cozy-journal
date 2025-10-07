class CozyJournal {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('cozyNotes')) || [];
        this.currentMood = null;

        this.moodColors = {
            happy: '#FFD700',
            calm: '#90EE90',
            sad: '#87CEEB',
            angry: '#FF6B6B',
            grateful: '#FFB6C1'
        };

        // Sound effects using Web Audio API
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = {
            pop: this.createPopSound.bind(this),
            whoosh: this.createWhooshSound.bind(this),
            click: this.createClickSound.bind(this)
        };

        this.elements = {
            addNoteBtn: document.getElementById('addNoteBtn'),
            stickyNote: document.getElementById('stickyNote'),
            stickyEditMode: document.getElementById('stickyEditMode'),
            stickyDisplayMode: document.getElementById('stickyDisplayMode'),
            noteInput: document.getElementById('noteInput'),
            stickyNoteText: document.getElementById('stickyNoteText'),
            stickyCloseBtn: document.getElementById('stickyCloseBtn'),
            pixelBox: document.getElementById('pixelBox'),
            flowerGarden: document.getElementById('flowerGarden'),
            noteModal: document.getElementById('noteModal'),
            modalFlower: document.getElementById('modalFlower'),
            modalNoteText: document.getElementById('modalNoteText'),
            modalDate: document.getElementById('modalDate'),
            closeModal: document.getElementById('closeModal'),
            createBtn: document.getElementById('createBtn'),
            cancelBtn: document.getElementById('cancelBtn'),
            drawingCanvas: document.getElementById('drawingCanvas'),
            clearCanvasBtn: document.getElementById('clearCanvasBtn'),
            uploadImageBtn: document.getElementById('uploadImageBtn'),
            imageUpload: document.getElementById('imageUpload'),
            displayCanvas: document.getElementById('displayCanvas'),
            letGoBtn: document.getElementById('letGoBtn'),
            modalCanvas: document.getElementById('modalCanvas'),
            modalLetGoBtn: document.getElementById('modalLetGoBtn'),
            catDecoration: document.getElementById('catDecoration'),
            quoteTooltip: document.getElementById('quoteTooltip'),
            lampHotspot: document.getElementById('lampHotspot')
        };

        // Dark mode state
        this.darkMode = localStorage.getItem('darkMode') === 'true';
        if (this.darkMode) {
            document.body.classList.add('dark-mode');
        }

        this.inspirationalQuotes = [
            "Every feeling is valid and worth expressing.",
            "Your thoughts matter, write them down.",
            "Small moments create big memories.",
            "Be gentle with yourself today.",
            "This too shall pass, but first, let it speak.",
            "You're doing better than you think.",
            "It's okay to not be okay sometimes.",
            "Your story is worth telling.",
            "One day at a time, one thought at a time.",
            "Writing is healing for the soul.",
            "Let your heart guide your pen.",
            "Celebrate the little victories.",
            "You are enough, just as you are.",
            "Tomorrow is a new beginning.",
            "Take a deep breath, you've got this."
        ];

        this.isDrawing = false;
        this.currentDrawing = null;
        this.isOverPlant = false;
        this.lastTrailTime = 0;
        this.trailDelay = 100; // milliseconds between trail flowers

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCanvas();
        this.renderPixelBox();
    }

    // Sound generation methods
    createPopSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    createWhooshSound() {
        // Create a cheerful ascending chime sound
        const now = this.audioContext.currentTime;
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 (major chord)

        notes.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = freq;
            oscillator.type = 'sine';

            const startTime = now + index * 0.08;
            const duration = 0.4;

            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        });
    }

    createClickSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = 600;
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.05);
    }

    playSound(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }

    setupEventListeners() {
        this.elements.addNoteBtn.addEventListener('click', () => this.showStickyNote());
        this.elements.createBtn.addEventListener('click', () => this.createNote());
        this.elements.cancelBtn.addEventListener('click', () => this.cancelNote());
        this.elements.stickyCloseBtn.addEventListener('click', () => this.closeStickyDisplay());
        this.elements.clearCanvasBtn.addEventListener('click', () => this.clearCanvas());
        this.elements.uploadImageBtn.addEventListener('click', () => this.elements.imageUpload.click());
        this.elements.imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));
        this.elements.letGoBtn.addEventListener('click', () => this.letGoNote());
        this.elements.modalLetGoBtn.addEventListener('click', () => this.letGoNote());

        this.elements.closeModal.addEventListener('click', () => this.closeModal());
        this.elements.noteModal.addEventListener('click', (e) => {
            if (e.target === this.elements.noteModal) {
                this.closeModal();
            }
        });

        // Canvas drawing events
        this.elements.drawingCanvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.elements.drawingCanvas.addEventListener('mousemove', (e) => this.draw(e));
        this.elements.drawingCanvas.addEventListener('mouseup', () => this.stopDrawing());
        this.elements.drawingCanvas.addEventListener('mouseleave', () => this.stopDrawing());

        // Touch events for mobile
        this.elements.drawingCanvas.addEventListener('touchstart', (e) => this.startDrawing(e));
        this.elements.drawingCanvas.addEventListener('touchmove', (e) => this.draw(e));
        this.elements.drawingCanvas.addEventListener('touchend', () => this.stopDrawing());

        // Drag and drop events for images
        this.elements.drawingCanvas.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.elements.drawingCanvas.addEventListener('drop', (e) => this.handleDrop(e));

        // Cat hover for inspirational quotes
        this.elements.catDecoration.addEventListener('mouseenter', () => this.showQuote());
        this.elements.catDecoration.addEventListener('mouseleave', () => this.hideQuote());

        // Plant hover trail effect
        const plantDecoration = document.querySelector('.plant-decoration');
        plantDecoration.addEventListener('mouseenter', () => {
            this.isOverPlant = true;
        });
        plantDecoration.addEventListener('mouseleave', () => {
            this.isOverPlant = false;
        });

        // Mouse trail effect when over plant
        document.addEventListener('mousemove', (e) => this.createMouseTrail(e));

        // Click effects only on background (not on buttons/popovers)
        document.addEventListener('click', (e) => this.createClickEffect(e));

        // Lamp click for dark mode toggle
        this.elements.lampHotspot.addEventListener('click', () => this.toggleDarkMode());
    }

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', this.darkMode);
        this.playSound('click');
    }

    createMouseTrail(e) {
        // Only create trail when hovering over plant
        if (!this.isOverPlant) {
            return;
        }

        const currentTime = Date.now();

        // Throttle trail creation to avoid too many flowers
        if (currentTime - this.lastTrailTime < this.trailDelay) {
            return;
        }

        this.lastTrailTime = currentTime;
        this.createFlowerTrail(e.clientX, e.clientY);
    }

    createFlowerTrail(x, y) {
        const flower = document.createElement('img');
        flower.className = 'click-effect flower-trail';
        flower.src = 'flowers.gif';
        flower.style.left = (x - 15) + 'px';
        flower.style.top = (y - 15) + 'px';
        flower.style.width = '30px';
        flower.style.height = '30px';

        document.body.appendChild(flower);

        setTimeout(() => {
            flower.remove();
        }, 800);
    }

    showQuote() {
        const randomQuote = this.inspirationalQuotes[Math.floor(Math.random() * this.inspirationalQuotes.length)];
        this.elements.quoteTooltip.textContent = randomQuote;
        this.elements.quoteTooltip.classList.add('visible');
    }

    hideQuote() {
        this.elements.quoteTooltip.classList.remove('visible');
    }

    createClickEffect(e) {
        // Only create effect if clicking on background, not on interactive elements
        const target = e.target;

        // Skip if clicking on buttons, inputs, canvas, popovers, pixel cells, or lamp
        if (target.tagName === 'BUTTON' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'CANVAS' ||
            target.tagName === 'IMG' ||
            target.closest('.sticky-note') ||
            target.closest('.note-modal') ||
            target.closest('.pixel-box') ||
            target.closest('.add-note-btn') ||
            target.closest('.lamp-hotspot')) {
            return;
        }

        this.createFlowerBloom(e.clientX, e.clientY);
    }

    createFlowerBloom(x, y) {
        const star = document.createElement('img');
        star.className = 'click-effect flower-bloom';
        star.src = 'Star Sticker by Venla Hannola.gif';
        star.style.left = (x - 30) + 'px';
        star.style.top = (y - 30) + 'px';
        star.style.width = '60px';
        star.style.height = '60px';

        document.body.appendChild(star);

        setTimeout(() => {
            star.remove();
        }, 1200);
    }

    setupCanvas() {
        this.ctx = this.elements.drawingCanvas.getContext('2d');
        this.ctx.lineWidth = 12;
        this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = '#080808';
        this.clearCanvas();
    }

    startDrawing(e) {
        this.isDrawing = true;
        const rect = this.elements.drawingCanvas.getBoundingClientRect();
        const scaleX = this.elements.drawingCanvas.width / rect.width;
        const scaleY = this.elements.drawingCanvas.height / rect.height;
        const x = ((e.clientX || e.touches[0].clientX) - rect.left) * scaleX;
        const y = ((e.clientY || e.touches[0].clientY) - rect.top) * scaleY;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
    }

    draw(e) {
        if (!this.isDrawing) return;
        e.preventDefault();
        const rect = this.elements.drawingCanvas.getBoundingClientRect();
        const scaleX = this.elements.drawingCanvas.width / rect.width;
        const scaleY = this.elements.drawingCanvas.height / rect.height;
        const x = ((e.clientX || e.touches[0].clientX) - rect.left) * scaleX;
        const y = ((e.clientY || e.touches[0].clientY) - rect.top) * scaleY;
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.elements.drawingCanvas.width, this.elements.drawingCanvas.height);
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        this.loadImageToCanvas(file);

        // Reset file input
        e.target.value = '';
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            this.loadImageToCanvas(file);
        }
    }

    loadImageToCanvas(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Clear canvas first
                this.clearCanvas();

                // Calculate scaling to fit image in canvas while maintaining aspect ratio
                const canvas = this.elements.drawingCanvas;
                const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
                const x = (canvas.width - img.width * scale) / 2;
                const y = (canvas.height - img.height * scale) / 2;

                // Draw image centered on canvas
                this.ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    showStickyNote() {
        this.playSound('click');
        this.elements.stickyNote.classList.add('visible');
        this.elements.stickyNote.classList.remove('display-mode');

        // Show edit mode, hide display mode
        this.elements.stickyEditMode.style.display = 'block';
        this.elements.stickyDisplayMode.style.display = 'none';

        this.elements.noteInput.value = '';
        this.clearCanvas();
        this.elements.noteInput.focus();
        this.elements.stickyNote.style.background = 'white';

        // Disable lamp hotspot when sticky note is visible
        this.elements.lampHotspot.classList.add('disabled');
    }

    createNote() {
        const noteText = this.elements.noteInput.value.trim();
        const drawing = this.elements.drawingCanvas.toDataURL();

        // Check if canvas is empty (pure white)
        const emptyCanvas = document.createElement('canvas');
        emptyCanvas.width = this.elements.drawingCanvas.width;
        emptyCanvas.height = this.elements.drawingCanvas.height;
        const emptyDrawing = emptyCanvas.toDataURL();
        const hasDrawing = drawing !== emptyDrawing;

        if (!noteText && !hasDrawing) {
            alert('Please write something or draw an emoji! 📝');
            return;
        }

        // If no drawing, use a random emoji from the folder
        let finalDrawing = hasDrawing ? drawing : this.getRandomEmojiPath();

        // Play pop sound when creating note
        this.playSound('pop');

        // Save note and add to pixel box
        this.saveNote(noteText, finalDrawing);
        this.addDrawingToPixelBox(finalDrawing, hasDrawing);

        // Close sticky note
        this.closeStickyDisplay();
    }

    getRandomEmojiPath() {
        const emojis = [
            'Random emojis/business-prodect-diamond.svg',
            'Random emojis/business-product-startup-2.svg',
            'Random emojis/business-products-climb-top.svg',
            'Random emojis/business-products-magic-rabbit.svg',
            'Random emojis/coding-apps-websites-android.svg',
            'Random emojis/coding-apps-websites-dinosaur-error.svg',
            'Random emojis/coding-apps-websites-favorite-rate.svg',
            'Random emojis/coding-apps-websites-music-player.svg',
            'Random emojis/coding-apps-websites-plugin.svg',
            'Random emojis/content-files-pencil-ruler.svg',
            'Random emojis/content-files-typing-machine.svg',
            'Random emojis/design-color-painting-palette.svg',
            'Random emojis/design-drawing-board.svg',
            'Random emojis/design-stamp.svg',
            'Random emojis/email-emoji-smile-smart.svg',
            'Random emojis/food-drink-bread.svg',
            'Random emojis/food-drink-coffee-cup.svg',
            'Random emojis/food-drink-coffee.svg',
            'Random emojis/food-drink-desert-cake-pond.svg',
            'Random emojis/food-drink-desert-cake.svg',
            'Random emojis/food-drink-desert-cotton-candy.svg',
            'Random emojis/food-drink-desert-cupcake.svg',
            'Random emojis/food-drink-desert-donut.svg',
            'Random emojis/food-drink-desert-icecream.svg',
            'Random emojis/food-drink-egg.svg',
            'Random emojis/food-drink-fish-bone.svg',
            'Random emojis/food-drink-fish.svg',
            'Random emojis/food-drink-fried-chicken.svg',
            'Random emojis/food-drink-fruit-cherry.svg',
            'Random emojis/food-drink-hamburger.svg',
            'Random emojis/food-drink-milk.svg',
            'Random emojis/food-drink-pizza.svg',
            'Random emojis/food-drink-rice-ball.svg',
            'Random emojis/food-drink-sushi.svg',
            'Random emojis/food-drink-tea.svg',
            'Random emojis/music-headphones-human.svg',
            'Random emojis/music-radio-stereo.svg',
            'Random emojis/pet-animals-bear.svg',
            'Random emojis/pet-animals-buffalo.svg',
            'Random emojis/pet-animals-cat.svg',
            'Random emojis/pet-animals-dog.svg',
            'Random emojis/pet-animals-frog-face.svg',
            'Random emojis/pet-animals-frog.svg',
            'Random emojis/pet-animals-gorilla.svg',
            'Random emojis/pet-animals-ox.svg',
            'Random emojis/pet-animals-pig.svg',
            'Random emojis/pet-animals-rabbit-1.svg',
            'Random emojis/pet-animals-rabbit-2.svg',
            'Random emojis/pet-animals-turtle.svg',
            'Random emojis/photography-focus-flower.svg',
            'Random emojis/transportation-bicycle.svg',
            'Random emojis/transportation-helicopter.svg',
            'Random emojis/transportation-motorcycle.svg',
            'Random emojis/transportation-plane.svg',
            'Random emojis/transportation-train.svg',
            'Random emojis/transportation-truck.svg',
            'Random emojis/transportation-vintage-train.svg',
            'Random emojis/weather-cloud-sun-fine.svg',
            'Random emojis/weather-cresent-moon-stars.svg',
            'Random emojis/weather-meteor.svg',
            'Random emojis/weather-moon.svg',
            'Random emojis/weather-rainbow.svg',
            'Random emojis/weather-snowman.svg',
            'Random emojis/weather-umbrella-snowing.svg',
            'Random emojis/weather-umbrella.svg',
            'Random emojis/weather-wind-flag.svg'
        ];
        return emojis[Math.floor(Math.random() * emojis.length)];
    }

    closeStickyDisplay() {
        // Just close without animation since cat already ate
        this.elements.stickyNote.classList.remove('visible', 'display-mode');
        this.currentMood = 'neutral';

        // Re-enable lamp hotspot when sticky note is closed
        this.elements.lampHotspot.classList.remove('disabled');
    }

    cancelNote() {
        this.playSound('click');
        this.elements.stickyNote.classList.remove('visible', 'display-mode');

        // Re-enable lamp hotspot when sticky note is closed
        this.elements.lampHotspot.classList.remove('disabled');
    }

    addDrawingToPixelBox(drawingData, isCanvas = true) {
        // Find first empty cell
        const cells = this.elements.pixelBox.querySelectorAll('.pixel-cell');
        for (let cell of cells) {
            if (!cell.querySelector('canvas') && !cell.querySelector('img')) {
                if (isCanvas) {
                    // Canvas drawing (hand-drawn or uploaded) - higher resolution
                    const miniCanvas = document.createElement('canvas');
                    miniCanvas.width = 480;
                    miniCanvas.height = 480;
                    miniCanvas.style.width = '40px';
                    miniCanvas.style.height = '40px';
                    miniCanvas.style.display = 'block';
                    const miniCtx = miniCanvas.getContext('2d');

                    const img = new Image();
                    img.onload = () => {
                        miniCtx.imageSmoothingEnabled = true;
                        miniCtx.imageSmoothingQuality = 'high';

                        // Calculate scaling to fit image while maintaining aspect ratio
                        const scale = Math.min(480 / img.width, 480 / img.height);
                        const x = (480 - img.width * scale) / 2;
                        const y = (480 - img.height * scale) / 2;

                        // Draw image centered without stretching
                        miniCtx.drawImage(img, x, y, img.width * scale, img.height * scale);
                    };
                    img.src = drawingData;

                    cell.appendChild(miniCanvas);
                } else {
                    // SVG emoji (random) - render on high-res canvas
                    const svgCanvas = document.createElement('canvas');
                    svgCanvas.width = 240;
                    svgCanvas.height = 240;
                    svgCanvas.style.width = '30px';
                    svgCanvas.style.height = '30px';
                    svgCanvas.style.display = 'block';
                    const svgCtx = svgCanvas.getContext('2d');

                    const img = new Image();
                    img.onload = () => {
                        svgCtx.imageSmoothingEnabled = true;
                        svgCtx.imageSmoothingQuality = 'high';
                        svgCtx.drawImage(img, 0, 0, 240, 240);
                    };
                    img.src = drawingData;

                    cell.appendChild(svgCanvas);
                }

                cell.dataset.noteId = this.notes[this.notes.length - 1]?.id || Date.now();
                break;
            }
        }
    }

    letGoNote() {
        // Get current note being viewed
        const noteId = this.currentViewingNoteId;
        if (!noteId) return;

        // Play whoosh sound when letting go
        this.playSound('whoosh');

        // Create particle explosion at modal position
        const modalRect = this.elements.noteModal.getBoundingClientRect();
        const centerX = modalRect.left + modalRect.width / 2;
        const centerY = modalRect.top + modalRect.height / 2;

        // Find the pixel box cell for this note
        const cells = this.elements.pixelBox.querySelectorAll('.pixel-cell');
        let pixelCell = null;
        cells.forEach(cell => {
            if (parseInt(cell.dataset.noteId) === noteId) {
                pixelCell = cell;
            }
        });

        // Create particle explosion at pixel box emoji position
        if (pixelCell) {
            const cellRect = pixelCell.getBoundingClientRect();
            const cellCenterX = cellRect.left + cellRect.width / 2;
            const cellCenterY = cellRect.top + cellRect.height / 2;
            this.createParticleExplosion(cellCenterX, cellCenterY);
        }

        // Fade out modal and pixel box emoji simultaneously
        this.elements.noteModal.style.transition = 'opacity 0.5s ease';
        this.elements.noteModal.style.opacity = '0';

        if (pixelCell) {
            const canvas = pixelCell.querySelector('canvas');
            if (canvas) {
                canvas.style.transition = 'opacity 0.5s ease';
                canvas.style.opacity = '0';
            }
        }

        // Wait for fade out before removing
        setTimeout(() => {
            // Remove note from storage
            this.notes = this.notes.filter(n => n.id !== noteId);
            localStorage.setItem('cozyNotes', JSON.stringify(this.notes));

            // Remove from pixel box
            if (pixelCell) {
                pixelCell.innerHTML = '';
                pixelCell.dataset.noteId = '';
            }

            // Close modal
            this.closeModal();
            this.elements.noteModal.style.transition = '';
            this.elements.noteModal.style.opacity = '';
        }, 500);
    }

    createParticleExplosion(x, y) {
        const particleCount = 30;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.position = 'fixed';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.width = '8px';
            particle.style.height = '8px';
            particle.style.borderRadius = '50%';
            particle.style.background = '#000';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '10000';

            const angle = (Math.PI * 2 * i) / particleCount;
            const velocity = 100 + Math.random() * 100;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;

            particle.style.setProperty('--tx', tx + 'px');
            particle.style.setProperty('--ty', ty + 'px');

            document.body.appendChild(particle);

            particle.style.animation = 'particleExplode 1s ease-out forwards';

            setTimeout(() => {
                particle.remove();
            }, 1000);
        }
    }

    renderPixelBox() {
        // Create 100 cells (10 columns x 10 rows)
        for (let i = 0; i < 100; i++) {
            const cell = document.createElement('div');
            cell.className = 'pixel-cell';
            cell.addEventListener('click', () => this.showPixelNote(cell));
            this.elements.pixelBox.appendChild(cell);
        }
    }

    showPixelNote(cell) {
        const noteId = parseInt(cell.dataset.noteId);
        if (noteId) {
            this.showNoteModal(noteId);
        }
    }

    saveNote(text, mood) {
        const note = {
            id: Date.now(),
            text: text,
            mood: mood,
            date: new Date().toISOString()
        };

        this.notes.push(note);
        localStorage.setItem('cozyNotes', JSON.stringify(this.notes));
    }


    showNoteModal(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;

        this.currentViewingNoteId = noteId;

        // Disable lamp hotspot when modal is visible
        this.elements.lampHotspot.classList.add('disabled');

        // Format date
        const date = new Date(note.date);
        const options = {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        };
        const formattedDate = date.toLocaleDateString('en-US', options);
        const location = '@Seattle'; // You can make this dynamic if needed
        this.elements.modalDate.textContent = `${formattedDate} ${location}`;

        // Display text if exists
        if (note.text) {
            this.elements.modalNoteText.textContent = note.text;
            this.elements.modalNoteText.style.display = 'block';
        } else {
            this.elements.modalNoteText.style.display = 'none';
        }

        // Display drawing if exists with higher resolution
        if (note.mood) {
            // Check if it's a canvas data URL or SVG path
            const isCanvas = note.mood.startsWith('data:image');

            if (isCanvas) {
                // Display canvas drawing (hand-drawn or uploaded image)
                const modalCanvas = this.elements.modalCanvas;
                const modalCtx = modalCanvas.getContext('2d');
                modalCtx.clearRect(0, 0, modalCanvas.width, modalCanvas.height);

                const img = new Image();
                img.onload = () => {
                    modalCtx.imageSmoothingEnabled = true;
                    modalCtx.imageSmoothingQuality = 'high';

                    // Calculate scaling to fit image while maintaining aspect ratio
                    const scale = Math.min(240 / img.width, 240 / img.height);
                    const x = (240 - img.width * scale) / 2;
                    const y = (240 - img.height * scale) / 2;

                    // Draw image centered without stretching
                    modalCtx.drawImage(img, x, y, img.width * scale, img.height * scale);
                };
                img.src = note.mood;
                this.elements.modalCanvas.style.display = 'block';
            } else {
                // Display SVG emoji
                const modalCanvas = this.elements.modalCanvas;
                const modalCtx = modalCanvas.getContext('2d');
                modalCtx.clearRect(0, 0, modalCanvas.width, modalCanvas.height);

                const img = new Image();
                img.onload = () => {
                    modalCtx.imageSmoothingEnabled = true;
                    modalCtx.imageSmoothingQuality = 'high';
                    // Center the SVG in the canvas
                    const size = 200;
                    const x = (240 - size) / 2;
                    const y = (240 - size) / 2;
                    modalCtx.drawImage(img, x, y, size, size);
                };
                img.src = note.mood;
                this.elements.modalCanvas.style.display = 'block';
            }
            this.elements.modalFlower.style.display = 'flex';
        } else {
            this.elements.modalFlower.style.display = 'none';
        }

        this.elements.noteModal.classList.add('visible');
    }

    closeModal() {
        this.playSound('click');
        this.elements.noteModal.classList.remove('visible');

        // Re-enable lamp hotspot when modal is closed
        this.elements.lampHotspot.classList.remove('disabled');
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new CozyJournal();
});

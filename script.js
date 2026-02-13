 // ============================================
        // STAGE 1: CLAW MACHINE
        // ============================================
        const ClawMachine = {
            canvas: null,
            ctx: null,
            engine: null,
            world: null,
            claw: {
                x: 200,
                y: 60,
                stringHeight: 0,
                openAngle: 45,
                closeAngle: 15,
                currentAngle: 45,
                targetAngle: 45,
                isDropping: false,
                isGrabbing: false
            },
            hearts: [],
            caughtHeart: null,
            
            init() {
                this.canvas = document.getElementById('clawCanvas');
                this.ctx = this.canvas.getContext('2d');
                
                this.canvas.width = this.canvas.offsetWidth;
                this.canvas.height = this.canvas.offsetHeight;
                
                this.engine = Matter.Engine.create();
                this.world = this.engine.world;
                this.world.gravity.y = 0.8;
                
                const boundaries = [
                    Matter.Bodies.rectangle(this.canvas.width / 2, this.canvas.height + 25, this.canvas.width, 50, { isStatic: true }),
                    Matter.Bodies.rectangle(-25, this.canvas.height / 2, 50, this.canvas.height, { isStatic: true }),
                    Matter.Bodies.rectangle(this.canvas.width + 25, this.canvas.height / 2, 50, this.canvas.height, { isStatic: true })
                ];
                
                Matter.World.add(this.world, boundaries);
                this.createHearts();
                this.animate();
            },
            
            createHearts() {
                const colors = ['#e63946', '#f72585', '#ff006e', '#fb5607', '#ff0a54'];
                
                for (let i = 0; i < 8; i++) {
                    // Spawn hearts in middle portion of canvas, adjusted for variable height
                    const spawnYMin = this.canvas.height * 0.4;
                    const spawnYMax = this.canvas.height * 0.8;
                    
                    const heart = Matter.Bodies.circle(
                        Math.random() * (this.canvas.width - 100) + 50,
                        Math.random() * (spawnYMax - spawnYMin) + spawnYMin,
                        28,
                        {
                            restitution: 0.6,
                            friction: 0.1,
                            density: 0.001,
                            render: {
                                fillStyle: colors[Math.floor(Math.random() * colors.length)]
                            }
                        }
                    );
                    
                    this.hearts.push(heart);
                    Matter.World.add(this.world, heart);
                }
            },
            
            moveLeft() {
                if (!this.claw.isDropping && this.claw.x > 80) {
                    this.claw.x -= 15;
                }
            },
            
            moveRight() {
                if (!this.claw.isDropping && this.claw.x < this.canvas.width - 80) {
                    this.claw.x += 15;
                }
            },
            
            drop() {
                if (this.claw.isDropping) return;
                
                this.claw.isDropping = true;
                
                const maxDropDistance = this.canvas.height - 80; // ~73% of canvas height
                const dropInterval = setInterval(() => {
                    if (this.claw.stringHeight < maxDropDistance) {
                        this.claw.stringHeight += 6;
                    } else {
                        clearInterval(dropInterval);
                        
                        this.claw.isGrabbing = true;
                        this.claw.targetAngle = this.claw.closeAngle;
                        
                        const closeInterval = setInterval(() => {
                            const diff = this.claw.targetAngle - this.claw.currentAngle;
                            this.claw.currentAngle += diff * 0.15;
                            
                            if (Math.abs(diff) < 0.5) {
                                this.claw.currentAngle = this.claw.targetAngle;
                                clearInterval(closeInterval);
                                
                                this.checkCatch();
                                
                                setTimeout(() => {
                                    const pullInterval = setInterval(() => {
                                        if (this.claw.stringHeight > 0) {
                                            this.claw.stringHeight -= 6;
                                            
                                            if (this.caughtHeart) {
                                                Matter.Body.setPosition(this.caughtHeart, {
                                                    x: this.claw.x,
                                                    y: this.claw.y + this.claw.stringHeight + 50
                                                });
                                                Matter.Body.setVelocity(this.caughtHeart, { x: 0, y: 0 });
                                            }
                                        } else {
                                            clearInterval(pullInterval);
                                            
                                            this.claw.targetAngle = this.claw.openAngle;
                                            const openInterval = setInterval(() => {
                                                const diff = this.claw.targetAngle - this.claw.currentAngle;
                                                this.claw.currentAngle += diff * 0.15;
                                                
                                                if (Math.abs(diff) < 0.5) {
                                                    this.claw.currentAngle = this.claw.targetAngle;
                                                    clearInterval(openInterval);
                                                    
                                                    if (this.caughtHeart && this.claw.y + this.claw.stringHeight < 150) {
                                                        this.success();
                                                    } else {
                                                        showToast('Coba lagi sayangku 🥺');
                                                    }
                                                    
                                                    this.caughtHeart = null;
                                                    this.claw.isGrabbing = false;
                                                    this.claw.isDropping = false;
                                                }
                                            }, 16);
                                        }
                                    }, 16);
                                }, 500);
                            }
                        }, 16);
                    }
                }, 16);
            },
            
            checkCatch() {
                const clawTipY = this.claw.y + this.claw.stringHeight + 35;
                
                this.hearts.forEach(heart => {
                    const distance = Math.sqrt(
                        Math.pow(heart.position.x - this.claw.x, 2) +
                        Math.pow(heart.position.y - clawTipY, 2)
                    );
                    
                    if (distance < 50 && !this.caughtHeart) {
                        this.caughtHeart = heart;
                    }
                });
            },
            
            success() {
                showToast('Yaaay! Kamu berhasil! 💖');
                
                setTimeout(() => {
                    transitionToStage('stage2');
                }, 1500);
            },
            
            drawClaw() {
                const ctx = this.ctx;
                const clawY = this.claw.y + this.claw.stringHeight;
                
                ctx.strokeStyle = '#b0b0b0';
                ctx.lineWidth = 6;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(50, this.claw.y);
                ctx.lineTo(this.canvas.width - 50, this.claw.y);
                ctx.stroke();
                
                ctx.fillStyle = '#dc2626';
                ctx.strokeStyle = '#991b1b';
                ctx.lineWidth = 2;
                
                ctx.beginPath();
                ctx.roundRect(this.claw.x - 22, clawY - 12, 44, 22, 6);
                ctx.fill();
                ctx.stroke();
                
                ctx.strokeStyle = '#4a5568';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(this.claw.x, this.claw.y);
                ctx.lineTo(this.claw.x, clawY - 12);
                ctx.stroke();
                
                ctx.strokeStyle = '#4a5568';
                ctx.lineWidth = 3.5;
                ctx.lineCap = 'round';
                
                const armLength = 28;
                const leftArmX = this.claw.x - Math.sin(this.claw.currentAngle * Math.PI / 180) * armLength;
                const rightArmX = this.claw.x + Math.sin(this.claw.currentAngle * Math.PI / 180) * armLength;
                const armY = clawY + 10 + Math.cos(this.claw.currentAngle * Math.PI / 180) * armLength;
                
                ctx.beginPath();
                ctx.moveTo(this.claw.x - 8, clawY + 10);
                ctx.lineTo(leftArmX, armY);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(this.claw.x + 8, clawY + 10);
                ctx.lineTo(rightArmX, armY);
                ctx.stroke();
                
                ctx.fillStyle = '#718096';
                ctx.beginPath();
                ctx.arc(leftArmX, armY, 4, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(rightArmX, armY, 4, 0, Math.PI * 2);
                ctx.fill();
            },
            
            drawHeart(x, y, size, color) {
                const ctx = this.ctx;
                ctx.save();
                ctx.translate(x, y);
                ctx.fillStyle = color;
                
                ctx.beginPath();
                const topCurveHeight = size * 0.3;
                ctx.moveTo(0, topCurveHeight);
                ctx.bezierCurveTo(-size / 2, -topCurveHeight, -size, topCurveHeight, 0, size);
                ctx.bezierCurveTo(size, topCurveHeight, size / 2, -topCurveHeight, 0, topCurveHeight);
                ctx.closePath();
                ctx.fill();
                
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.beginPath();
                ctx.arc(-size * 0.2, -size * 0.1, size * 0.2, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            },
            
            animate() {
                Matter.Engine.update(this.engine, 1000 / 60);
                
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                
                this.hearts.forEach(heart => {
                    this.drawHeart(heart.position.x, heart.position.y, 24, heart.render.fillStyle);
                });
                
                this.drawClaw();
                
                requestAnimationFrame(() => this.animate());
            }
        };
        
        // ============================================
        // AUDIO CONTROL
        // ============================================
        let isMuted = false;
        const muteBtn = document.getElementById('muteBtn');
        const bgMusic = document.getElementById('bgMusic');
        
        muteBtn.addEventListener('click', () => {
            isMuted = !isMuted;
            if (isMuted) {
                bgMusic.pause();
                muteBtn.textContent = '🔇';
            } else {
                bgMusic.play().catch(e => console.log('Autoplay prevented:', e));
                muteBtn.textContent = '🔊';
            }
        });
        
        // ============================================
        // HELPER FUNCTIONS
        // ============================================
        function showToast(message) {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
        
        function transitionToStage(stageId) {
            document.querySelectorAll('.stage').forEach(stage => {
                stage.classList.remove('active');
            });
            
            document.getElementById(stageId).classList.add('active');
        }
        
        function createConfetti() {
            const container = document.getElementById('confettiContainer');
            const hearts = ['💖', '💕', '💗', '💝', '💓', '💞', '💘'];
            
            for (let i = 0; i < 50; i++) {
                setTimeout(() => {
                    const confetti = document.createElement('div');
                    confetti.className = 'confetti';
                    confetti.textContent = hearts[Math.floor(Math.random() * hearts.length)];
                    confetti.style.left = Math.random() * 100 + '%';
                    confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
                    confetti.style.animationDelay = (Math.random() * 2) + 's';
                    
                    container.appendChild(confetti);
                    
                    setTimeout(() => {
                        confetti.remove();
                    }, 5000);
                }, i * 100);
            }
        }
        
        function playMusic() {
            const music = document.getElementById('bgMusic');
            music.play().catch(e => {
                console.log('Autoplay prevented:', e);
            });
        }
        
        // ============================================
        // STAGE 2: LOVE LETTER
        // ============================================
        document.getElementById('envelope').addEventListener('click', function() {
            this.classList.add('opened');
            setTimeout(() => {
                document.getElementById('letterContent').classList.add('show');
                // Play romantic music when letter opens
                playMusic();
            }, 800);
        });
        
        document.getElementById('continueBtn').addEventListener('click', () => {
            transitionToStage('stage3');
        });
        
       
        // STAGE 3: PROPOSAL (FINAL REFINED)
        // ============================================
        const noBtn = document.getElementById('noBtn');
        const yesBtn = document.getElementById('yesBtn');
        const pleaText = document.getElementById('pleaText');
        
        const pleaMessages = [
            "Pliss? 🥺", "ayooo dongg sayanggg", "yang bener ajeee sayang... 😢",
            "aku janji bakal baik banget... 🥹", "Masa iya engga? 😭",
            "pretty please? 🙏", "Aku udah siapin semuanya loh... 💝",  
        ];
        
        let pleaIndex = 0;
        let mouseX = 0;
        let mouseY = 0;

        // Tracking posisi kursor & sentuhan untuk algoritma menghindar
        const updateCoords = (x, y) => { mouseX = x; mouseY = y; };
        document.addEventListener('mousemove', (e) => {
            updateCoords(e.clientX, e.clientY);
            checkProximity(e.clientX, e.clientY);
        });
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                updateCoords(e.touches[0].clientX, e.touches[0].clientY);
                checkProximity(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: false });

        function checkProximity(x, y) {
            const rect = noBtn.getBoundingClientRect();
            const btnCenterX = rect.left + rect.width / 2;
            const btnCenterY = rect.top + rect.height / 2;
            const distance = Math.sqrt(Math.pow(x - btnCenterX, 2) + Math.pow(y - btnCenterY, 2));
            
            // Jarak sensitivitas kursor (80px) untuk memicu tombol lari
            if (distance < 80) {
                moveNoButton();
            }
        }

        function moveNoButton() {
            const btnWidth = noBtn.offsetWidth;
            const btnHeight = noBtn.offsetHeight;
            const padding = 50; 
            const minCursorDist = 150; 
            
            let newLeft, newTop;
            let found = false;
            let attempts = 0;

            while (!found && attempts < 25) {
                newLeft = Math.random() * (window.innerWidth - btnWidth - (padding * 2)) + padding;
                newTop = Math.random() * (window.innerHeight - btnHeight - (padding * 2)) + padding;
                
                const distToCursor = Math.sqrt(
                    Math.pow(newLeft + btnWidth / 2 - mouseX, 2) + 
                    Math.pow(newTop + btnHeight / 2 - mouseY, 2)
                );
                if (distToCursor > minCursorDist) found = true;
                attempts++;
            }

            Object.assign(noBtn.style, {
                position: 'fixed',
                left: `${newLeft}px`,
                top: `${newTop}px`,
                zIndex: '9999',
                margin: '0',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            });
        }

        // Fungsi menampilkan pesan secara berurutan (hanya saat klik)
        function showNextPlea() {
            pleaText.textContent = pleaMessages[pleaIndex];
            pleaText.classList.add('show');
            
            // Update index untuk klik berikutnya
            pleaIndex = (pleaIndex + 1) % pleaMessages.length;

            clearTimeout(window.pleaTimeout);
            window.pleaTimeout = setTimeout(() => {
                pleaText.classList.remove('show');
            }, 3000); // Pesan tampil selama 3 detik
        }

        // --- EVENT LISTENERS ---

        // Desktop: Lari saat didekati
        noBtn.addEventListener('mouseenter', moveNoButton);

        // Mobile: Lari saat disentuh
        noBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            moveNoButton();
        });

        // Tampilkan teks HANYA saat klik (atau tap cepat) berhasil dilakukan
        noBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showNextPlea(); // Tampilkan pesan berurutan
            moveNoButton(); // Tetap lari setelah diklik
            
            // Opsional: Tetap tampilkan toast pesan singkat
            showToast("Gak bisa diklik wlee 😜");
        });

        // Yes Button
        document.getElementById('yesBtn').addEventListener('click', () => {
            createConfetti();
            setTimeout(() => transitionToStage('stage4'), 1000);
        });

        // Initial setup posisi tombol No agar tidak berantakan di awal
        window.addEventListener('load', () => {
            const rect = yesBtn.getBoundingClientRect();
            Object.assign(noBtn.style, {
                position: 'fixed',
                left: `${rect.right + 20}px`,
                top: `${rect.top}px`,
                zIndex: '9999'
            });
        });

        // Tracking posisi kursor (Desktop)
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            checkProximity(e.clientX, e.clientY);
        });

        // Tracking posisi sentuhan (Mobile)
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                const touchX = e.touches[0].clientX;
                const touchY = e.touches[0].clientY;
                mouseX = touchX; // Update untuk algoritma safe zone
                mouseY = touchY;
                checkProximity(touchX, touchY);
            }
        }, { passive: false });

        // Deteksi jarak kursor/jari ke tombol
        function checkProximity(x, y) {
            const rect = noBtn.getBoundingClientRect();
            const btnCenterX = rect.left + rect.width / 2;
            const btnCenterY = rect.top + rect.height / 2;
            
            const distance = Math.sqrt(Math.pow(x - btnCenterX, 2) + Math.pow(y - btnCenterY, 2));
            
            // Jika kursor mendekat dalam radius 100px, tombol menghindar
            if (distance < 100) {
                moveNoButton();
                showPleaMessage();
            }
        }

        function moveNoButton() {
            const btnWidth = noBtn.offsetWidth;
            const btnHeight = noBtn.offsetHeight;
            const padding = 50; // Jarak minimal dari tepi layar
            const minCursorDist = 150; // Jarak minimal dari kursor
            
            let newLeft, newTop;
            let found = false;
            let attempts = 0;

            // Cari posisi baru (Maksimal 25 percobaan)
            while (!found && attempts < 25) {
                newLeft = Math.random() * (window.innerWidth - btnWidth - (padding * 2)) + padding;
                newTop = Math.random() * (window.innerHeight - btnHeight - (padding * 2)) + padding;
                
                const distToCursor = Math.sqrt(
                    Math.pow(newLeft + btnWidth / 2 - mouseX, 2) + 
                    Math.pow(newTop + btnHeight / 2 - mouseY, 2)
                );

                if (distToCursor > minCursorDist) {
                    found = true;
                }
                attempts++;
            }

            // Gunakan fixed agar bebas dari batasan parent container
            Object.assign(noBtn.style, {
                position: 'fixed',
                left: `${newLeft}px`,
                top: `${newTop}px`,
                zIndex: '9999',
                margin: '0',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            });
            
            noBtn.classList.add('moving');
            setTimeout(() => noBtn.classList.remove('moving'), 300);
        }

        function showPleaMessage() {
            pleaText.textContent = pleaMessages[pleaIndex];
            pleaText.classList.add('show');
            pleaIndex = (pleaIndex + 1) % pleaMessages.length;
            
            clearTimeout(window.pleaTimeout);
            window.pleaTimeout = setTimeout(() => {
                pleaText.classList.remove('show');
            }, 2000);
        }

        // Event Listener Desktop
        noBtn.addEventListener('mouseenter', moveNoButton);

        // Event Listener Mobile
        noBtn.addEventListener('touchstart', (e) => {
            e.preventDefault(); 
            moveNoButton();
            showPleaMessage();
        });

        // Tetap handle klik (jika user sangat cepat)
        noBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            noBtnClicks++;
            const toastMessages = ["Yakin? 🥺", "Tega banget... 😢", "Ga boleh No! 😭"];
            showToast(toastMessages[Math.min(noBtnClicks - 1, toastMessages.length - 1)]);
            moveNoButton();
        });

        // YES Button Logic (Tetap Aman)
        document.getElementById('yesBtn').addEventListener('click', () => {
            createConfetti();
            setTimeout(() => {
                transitionToStage('stage4');
            }, 1000);
        });

        // Pastikan posisi awal tombol No rapi saat stage dimuat
        window.addEventListener('load', () => {
            const rect = yesBtn.getBoundingClientRect();
            Object.assign(noBtn.style, {
                position: 'fixed',
                left: `${rect.right + 20}px`,
                top: `${rect.top}px`,
                zIndex: '9999'
            });
        });
        
        // ============================================
        // STAGE 4: GRAND FINALE
        // ============================================
        const giftMessages = {
            1: {
                emoji: '🫶🏻',
                message: 'Aku akan selalu memberi cinta dan kasih sayang dalam keadaan apapun,sayangku. I love you to the moon and back! ❤️',
                gif: 'aing dua.jpeg'
            },
            2: {
                emoji: '🔥',
                message: ' Tak lupa kamu adalah semangat yang membuat hariku sempurna, maka dari itu kamu juga harus sama semangatnyaaaa. Semangat terus sayangku, semoga semua plans kamu terwujud yaa! 💪🏻💖',
                gif: 'aing hiji.jpeg'
            },
            3: {
                emoji: '🎵',
                message: 'Setiap lagu cinta mengingatkanku padamu. Kamu adalah melodi terindah dalam hidupku. Forever and always, my love! 💝',
                gif: 'cuy.jpeg'
            }
        };
        
        document.querySelectorAll('.gift-box').forEach(box => {
            box.addEventListener('click', function() {
                const giftNumber = this.dataset.gift;
                const gift = giftMessages[giftNumber];
                
                this.classList.add('opened');
                
                document.getElementById('popupEmoji').textContent = gift.emoji;
                document.getElementById('popupMessage').textContent = gift.message;
                
                const gifElement = document.getElementById('popupGif');
                gifElement.src = gift.gif;
                
                document.getElementById('giftPopup').classList.add('show');
            });
        });
        
        document.getElementById('closePopupBtn').addEventListener('click', () => {
            document.getElementById('giftPopup').classList.remove('show');
        });
        
        document.getElementById('giftPopup').addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
            }
        });
        
        // ============================================
        // INITIALIZATION
        // ============================================
        
        // Track which key/button is held
        let leftHeld = false, rightHeld = false;
        
        // Continuous movement loop for held buttons
        function updateClawMovement() {
            if (leftHeld) ClawMachine.moveLeft();
            if (rightHeld) ClawMachine.moveRight();
            requestAnimationFrame(updateClawMovement);
        }
        updateClawMovement();
        
        document.addEventListener('DOMContentLoaded', () => {
            ClawMachine.init();
            
            // LEFT BUTTON - Mouse/Touch Hold Support
            const leftBtn = document.getElementById('moveLeft');
            leftBtn.addEventListener('mousedown', () => { leftHeld = true; });
            leftBtn.addEventListener('mouseup', () => { leftHeld = false; });
            leftBtn.addEventListener('mouseleave', () => { leftHeld = false; });
            leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); leftHeld = true; });
            leftBtn.addEventListener('touchend', () => { leftHeld = false; });
            
            // RIGHT BUTTON - Mouse/Touch Hold Support
            const rightBtn = document.getElementById('moveRight');
            rightBtn.addEventListener('mousedown', () => { rightHeld = true; });
            rightBtn.addEventListener('mouseup', () => { rightHeld = false; });
            rightBtn.addEventListener('mouseleave', () => { rightHeld = false; });
            rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); rightHeld = true; });
            rightBtn.addEventListener('touchend', () => { rightHeld = false; });
            
            // DROP BUTTON
            document.getElementById('dropBtn').addEventListener('click', () => ClawMachine.drop());
            
            // Hide photo placeholders when images are present/loaded
            document.querySelectorAll('.photo-frame').forEach(frame => {
                const img = frame.querySelector('img');
                const placeholder = frame.querySelector('.photo-placeholder');

                if (!placeholder) return;

                if (img) {
                    // If already loaded
                    if (img.complete && img.naturalWidth > 0) {
                        placeholder.style.display = 'none';
                    }

                    // When image loads later
                    img.addEventListener('load', () => {
                        placeholder.style.display = 'none';
                    });

                    // If image fails to load, keep placeholder visible
                    img.addEventListener('error', () => {
                        placeholder.style.display = 'flex';
                    });
                }
            });
        });
// ========== 설정 ==========
const CONFIG = {
    // Google Apps Script 웹 앱 URL
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzoP2JhJpm5Jg3ZQWdaCypjjTNSJeUDeQbSyXK1fd5G-9mEbkPdPl95GwAdyy0EuNis/exec',

    // 결혼식 정보
    WEDDING_DATE: '2026-05-10',
    WEDDING_TIME: '12:00',

    // 예식장 좌표
    VENUE_LAT: 37.4936,
    VENUE_LNG: 126.7230,
    VENUE_NAME: '에스칼라디움',
    VENUE_ADDRESS: '인천 광역시 부평구 길주로 623',

    // 카카오톡 공유 설정
    KAKAO_APP_KEY: 'YOUR_KAKAO_APP_KEY',
    SHARE_URL: 'https://ilrabu0418.github.io/wedding/',
    COPY_URL: 'https://m.site.naver.com/1ZcFz',

    // 방명록 설정
    GUESTBOOK_PREVIEW_COUNT: 3,
    GUESTBOOK_PAGE_SIZE: 10
};

// ========== 랜덤 테마 팔레트 ==========
const THEME_PALETTES = [
    { name: 'brown',     primary: '#b08968', light: '#ddb892', dark: '#7f5539', rgb: '176,137,104', bgLight: '#faf8f5', border: '#e8e2dc' },
    { name: 'rosegold',  primary: '#b76e79', light: '#d4a0a7', dark: '#8e4955', rgb: '183,110,121', bgLight: '#fdf6f7', border: '#e9d5d8' },
    { name: 'sage',      primary: '#8fa38b', light: '#b5c9b2', dark: '#637e5f', rgb: '143,163,139', bgLight: '#f5f8f4', border: '#d6e2d4' },
    { name: 'dustyblue', primary: '#7d9bb5', light: '#a8c0d4', dark: '#567a94', rgb: '125,155,181', bgLight: '#f4f7fa', border: '#d4dee8' },
    { name: 'lavender',  primary: '#9b8bb4', light: '#c4b8d6', dark: '#6d5e87', rgb: '155,139,180', bgLight: '#f7f5fa', border: '#e2dce9' },
    { name: 'blush',     primary: '#c9a4a0', light: '#e0c5c2', dark: '#a17e7a', rgb: '201,164,160', bgLight: '#fbf6f5', border: '#ead8d6' }
];

// ========== 초기화 ==========
document.addEventListener('DOMContentLoaded', function() {
    // 카카오 SDK 초기화
    if (typeof Kakao !== 'undefined' && !Kakao.isInitialized()) {
        Kakao.init('bc6422965deb30a7a1ed4a95b6b6580e');
    }

    initRandomTheme();
    initCover();
    initScrollReveal();
    initMusicPlayer();
    initCalendar();
    initDdayCounter();
    initPolaroidGallery();
    initGalleryModal();
    initContactToggle();
    initAccountToggle();
    initGuestbook();
    initMap();
    initShareButtons();
});

// ========== 랜덤 테마 ==========
function initRandomTheme() {
    var palette = THEME_PALETTES[Math.floor(Math.random() * THEME_PALETTES.length)];
    var root = document.documentElement.style;
    root.setProperty('--primary-color', palette.primary);
    root.setProperty('--primary-light', palette.light);
    root.setProperty('--primary-dark', palette.dark);
    root.setProperty('--primary-rgb', palette.rgb);
    root.setProperty('--bg-light', palette.bgLight);
    root.setProperty('--border-color', palette.border);
}

// ========== V2 커버 페이지 ==========
function initCover() {
    var cover = document.getElementById('cover');
    var invitation = document.getElementById('invitation');
    if (!cover || !invitation) return;

    var openBtn = cover.querySelector('.cover-btn');

    function openInvitation() {
        cover.classList.add('hidden');
        invitation.classList.add('visible');
        document.body.style.overflow = '';
    }

    if (openBtn) {
        openBtn.addEventListener('click', openInvitation);
    }

    // 스와이프 업으로 열기
    var touchStartY = 0;
    cover.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    cover.addEventListener('touchend', function(e) {
        var dy = touchStartY - e.changedTouches[0].clientY;
        if (dy > 60) openInvitation();
    });

    // 커버가 보이는 동안 스크롤 방지
    document.body.style.overflow = 'hidden';
}

// ========== 스크롤 애니메이션 ==========
function initScrollReveal() {
    var reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -30px 0px'
    });

    reveals.forEach(function(el) {
        observer.observe(el);
    });
}

// ========== 배경음악 플레이어 ==========
function initMusicPlayer() {
    var bgm = document.getElementById('bgm');
    var musicBtn = document.getElementById('music-btn');
    if (!bgm || !musicBtn) return;

    var isPlaying = false;

    function playMusic() {
        bgm.play().then(function() {
            musicBtn.classList.add('playing');
            isPlaying = true;
        }).catch(function(error) {
            console.log('Play blocked:', error);
        });
    }

    function pauseMusic() {
        bgm.pause();
        musicBtn.classList.remove('playing');
        isPlaying = false;
    }

    musicBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (isPlaying) { pauseMusic(); } else { playMusic(); }
    });

    musicBtn.addEventListener('mousedown', function(e) { e.stopPropagation(); });

    // 커버 열기 시 자동 재생 (MutationObserver)
    var cover = document.getElementById('cover');
    if (cover) {
        var coverObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(m) {
                if (m.target.classList.contains('hidden') && !isPlaying) {
                    playMusic();
                    coverObserver.disconnect();
                }
            });
        });
        coverObserver.observe(cover, { attributes: true, attributeFilter: ['class'] });
    } else {
        // 커버가 없는 경우 (guestbook.html 등) 첫 인터랙션에서 재생
        var firstInteraction = true;
        function handleFirstInteraction(e) {
            if (musicBtn.contains(e.target)) return;
            if (firstInteraction && !isPlaying) {
                playMusic();
                firstInteraction = false;
            }
            document.removeEventListener('click', handleFirstInteraction);
            document.removeEventListener('touchstart', handleFirstInteraction);
        }
        document.addEventListener('click', handleFirstInteraction);
        document.addEventListener('touchstart', handleFirstInteraction);
    }

    bgm.addEventListener('ended', function() {
        bgm.currentTime = 0;
        bgm.play();
    });
}

// ========== D-Day 카운터 ==========
function initDdayCounter() {
    var ddayElement = document.getElementById('dday-count');
    if (!ddayElement) return;

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var weddingDay = new Date(CONFIG.WEDDING_DATE);
    weddingDay.setHours(0, 0, 0, 0);
    var diff = Math.ceil((weddingDay - today) / (1000 * 60 * 60 * 24));

    if (diff > 0) {
        ddayElement.textContent = 'D-' + diff;
    } else if (diff === 0) {
        ddayElement.textContent = 'D-Day';
    } else {
        ddayElement.textContent = 'D+' + Math.abs(diff);
    }
}

// ========== 캘린더 ==========
function initCalendar() {
    var calendarDays = document.getElementById('calendar-days');
    if (!calendarDays) return;

    var weddingDate = new Date(CONFIG.WEDDING_DATE);
    var year = weddingDate.getFullYear();
    var month = weddingDate.getMonth();
    var weddingDay = weddingDate.getDate();

    var firstDay = new Date(year, month, 1);
    var lastDay = new Date(year, month + 1, 0);

    var calendarMonth = document.querySelector('.calendar-month');
    if (calendarMonth) {
        calendarMonth.textContent = year + '년 ' + (month + 1) + '월';
    }

    var html = '';
    for (var i = 0; i < firstDay.getDay(); i++) {
        html += '<span></span>';
    }
    for (var day = 1; day <= lastDay.getDate(); day++) {
        var dayOfWeek = new Date(year, month, day).getDay();
        var className = '';
        if (day === weddingDay) {
            className = 'wedding-day';
        } else if (dayOfWeek === 0) {
            className = 'sun';
        } else if (dayOfWeek === 6) {
            className = 'sat';
        }
        html += '<span class="' + className + '">' + day + '</span>';
    }
    calendarDays.innerHTML = html;
}

// ========== 폴라로이드 갤러리 카운터 ==========
function initPolaroidGallery() {
    var track = document.getElementById('gallery-track');
    var currentEl = document.getElementById('gallery-current');
    var totalEl = document.getElementById('gallery-total');
    if (!track) return;

    var items = track.querySelectorAll('.v3-polaroid');
    if (items.length === 0) return;

    if (totalEl) totalEl.textContent = items.length;
    if (currentEl) currentEl.textContent = '1';

    var scrollTimeout;
    track.addEventListener('scroll', function() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function() {
            var scrollLeft = track.scrollLeft;
            var itemWidth = items[0].offsetWidth + 16;
            var activeIndex = Math.round(scrollLeft / itemWidth);
            activeIndex = Math.max(0, Math.min(activeIndex, items.length - 1));
            if (currentEl) currentEl.textContent = (activeIndex + 1);
        }, 50);
    });
}

// ========== 갤러리 모달 ==========
function initGalleryModal() {
    var items = document.querySelectorAll('.v3-polaroid');
    var modal = document.getElementById('image-modal');
    var modalImage = document.getElementById('modal-image');
    var modalClose = document.querySelector('.modal-close');
    var modalPrev = document.querySelector('.modal-prev');
    var modalNext = document.querySelector('.modal-next');

    if (!modal || items.length === 0) return;

    var currentIndex = 0;
    var images = Array.from(items).map(function(item) {
        return item.querySelector('img').src;
    });

    function showImage(index) {
        currentIndex = index;
        if (currentIndex < 0) currentIndex = images.length - 1;
        if (currentIndex >= images.length) currentIndex = 0;
        modalImage.src = images[currentIndex];
    }

    items.forEach(function(item, index) {
        item.addEventListener('click', function() {
            showImage(index);
            modal.classList.add('show');
        });
    });

    if (modalClose) {
        modalClose.addEventListener('click', function() { modal.classList.remove('show'); });
    }
    if (modalPrev) {
        modalPrev.addEventListener('click', function() { showImage(currentIndex - 1); });
    }
    if (modalNext) {
        modalNext.addEventListener('click', function() { showImage(currentIndex + 1); });
    }

    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.classList.remove('show');
    });

    // 키보드 네비게이션
    document.addEventListener('keydown', function(e) {
        if (!modal.classList.contains('show')) return;
        if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
        if (e.key === 'ArrowRight') showImage(currentIndex + 1);
        if (e.key === 'Escape') modal.classList.remove('show');
    });

    // 모바일 스와이프
    var touchStartX = 0, touchStartY = 0, isSwiping = false;
    modal.addEventListener('touchstart', function(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isSwiping = false;
    }, { passive: true });

    modal.addEventListener('touchmove', function(e) {
        if (!modal.classList.contains('show')) return;
        var dx = Math.abs(e.touches[0].clientX - touchStartX);
        var dy = Math.abs(e.touches[0].clientY - touchStartY);
        if (dx > dy && dx > 10) { isSwiping = true; e.preventDefault(); }
    }, { passive: false });

    modal.addEventListener('touchend', function(e) {
        if (!modal.classList.contains('show') || !isSwiping) return;
        var dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 50) {
            if (dx < 0) showImage(currentIndex + 1);
            else showImage(currentIndex - 1);
        }
        isSwiping = false;
    });
}

// ========== 연락처 토글 ==========
function initContactToggle() {
    document.querySelectorAll('.contact-toggle').forEach(function(button) {
        button.addEventListener('click', function() {
            var targetId = button.getAttribute('data-target');
            var targetList = document.getElementById(targetId);
            button.classList.toggle('active');
            targetList.classList.toggle('show');
        });
    });
}

// ========== 계좌번호 토글 & 복사 ==========
function initAccountToggle() {
    document.querySelectorAll('.account-toggle').forEach(function(button) {
        button.addEventListener('click', function() {
            var targetId = button.getAttribute('data-target');
            var targetList = document.getElementById(targetId);
            button.classList.toggle('active');
            targetList.classList.toggle('show');
        });
    });

    document.querySelectorAll('.btn-copy').forEach(function(button) {
        button.addEventListener('click', function() {
            var account = button.getAttribute('data-account');
            copyToClipboard(account);
            showToast('계좌번호가 복사되었습니다');
        });
    });
}

// ========== 방명록 ==========
function initGuestbook() {
    var form = document.getElementById('guestbook-form');
    if (form) {
        form.addEventListener('submit', handleGuestbookSubmit);
    }

    var guestbookList = document.getElementById('guestbook-list');
    if (guestbookList) {
        loadGuestbook(CONFIG.GUESTBOOK_PREVIEW_COUNT);
    }
}

async function handleGuestbookSubmit(e) {
    e.preventDefault();

    var name = document.getElementById('gb-name').value.trim();
    var message = document.getElementById('gb-message').value.trim();

    if (!name || !message) {
        showToast('모든 항목을 입력해주세요');
        return;
    }

    try {
        var response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'write',
                name: name,
                message: message
            })
        });

        var result = await response.json();
        if (result.success) {
            showToast('축하 메시지가 등록되었습니다');
            e.target.reset();
        } else {
            showToast(result.error || '등록에 실패했습니다');
            return;
        }

        var guestbookList = document.getElementById('guestbook-list');
        var guestbookListFull = document.getElementById('guestbook-list-full');
        if (guestbookList) loadGuestbook(CONFIG.GUESTBOOK_PREVIEW_COUNT);
        if (guestbookListFull) loadAllGuestbook();
    } catch (error) {
        console.error('Error:', error);
        showToast('등록에 실패했습니다. 다시 시도해주세요');
    }
}

async function loadGuestbook(limit) {
    var guestbookList = document.getElementById('guestbook-list');
    if (!guestbookList) return;

    try {
        var response = await fetch(CONFIG.APPS_SCRIPT_URL + '?action=read&limit=' + limit);
        var data = await response.json();

        if (data.success && data.data.length > 0) {
            guestbookList.innerHTML = data.data.map(function(item) {
                return createGuestbookItem(item);
            }).join('');
        } else {
            guestbookList.innerHTML = '<p class="no-message">아직 등록된 메시지가 없습니다</p>';
        }
    } catch (error) {
        console.error('Error loading guestbook:', error);
        guestbookList.innerHTML = '<div class="guestbook-item glass-subtle">' +
            '<div class="guestbook-item-header">' +
            '<span class="guestbook-name">홍길동</span>' +
            '<span class="guestbook-date">2026.01.01</span>' +
            '</div>' +
            '<p class="guestbook-message">결혼 축하해요! 행복하게 잘 살아~</p>' +
            '</div>';
    }
}

async function loadAllGuestbook(page) {
    page = page || 1;
    var guestbookListFull = document.getElementById('guestbook-list-full');
    var totalCountEl = document.getElementById('total-count');
    var paginationEl = document.getElementById('pagination');
    if (!guestbookListFull) return;

    try {
        var response = await fetch(CONFIG.APPS_SCRIPT_URL + '?action=readAll&page=' + page + '&pageSize=' + CONFIG.GUESTBOOK_PAGE_SIZE);
        var data = await response.json();

        if (data.success) {
            if (totalCountEl) totalCountEl.textContent = data.total;
            if (data.data.length > 0) {
                guestbookListFull.innerHTML = data.data.map(function(item) {
                    return createGuestbookItem(item, true);
                }).join('');
            } else {
                guestbookListFull.innerHTML = '<p class="no-message">아직 등록된 메시지가 없습니다</p>';
            }
            if (paginationEl && data.totalPages > 1) {
                var paginationHtml = '';
                for (var i = 1; i <= data.totalPages; i++) {
                    paginationHtml += '<button class="' + (i === page ? 'active' : '') + '" onclick="loadAllGuestbook(' + i + ')">' + i + '</button>';
                }
                paginationEl.innerHTML = paginationHtml;
            }
        }
    } catch (error) {
        console.error('Error loading guestbook:', error);
    }
}

function createGuestbookItem(item, showDelete) {
    var deleteButton = showDelete ?
        '<button class="guestbook-delete" onclick="deleteGuestbookItem(\'' + item.id + '\')">삭제</button>' : '';

    return '<div class="guestbook-item glass-subtle" data-id="' + item.id + '">' +
        '<div class="guestbook-item-header">' +
        '<span class="guestbook-name">' + escapeHtml(item.name) + '</span>' +
        '<span class="guestbook-date">' + item.date + '</span>' +
        '</div>' +
        '<p class="guestbook-message">' + escapeHtml(item.message) + '</p>' +
        deleteButton +
        '</div>';
}

// ========== 관리자 모드 ==========
const ADMIN_PASSWORD = '0130';
var isAdminMode = false;
var deleteTargetId = null;
var settingsClickCount = 0;
var settingsClickTimer = null;

function initAdminMode() {
    var settingsBtn = document.getElementById('btn-settings');
    var adminModal = document.getElementById('admin-modal');
    var cancelAdminBtn = document.getElementById('btn-cancel-admin');
    var confirmAdminBtn = document.getElementById('btn-confirm-admin');
    var exitAdminBtn = document.getElementById('btn-exit-admin');
    var deleteConfirmModal = document.getElementById('delete-confirm-modal');
    var cancelDeleteBtn = document.getElementById('btn-cancel-delete');
    var confirmDeleteBtn = document.getElementById('btn-confirm-delete');

    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            if (isAdminMode) { exitAdminMode(); return; }
            settingsClickCount++;
            if (settingsClickTimer) clearTimeout(settingsClickTimer);
            if (settingsClickCount >= 3) {
                settingsClickCount = 0;
                adminModal.classList.add('show');
            } else {
                settingsClickTimer = setTimeout(function() { settingsClickCount = 0; }, 1000);
            }
        });
    }

    if (cancelAdminBtn) {
        cancelAdminBtn.addEventListener('click', function() {
            adminModal.classList.remove('show');
            document.getElementById('admin-password').value = '';
        });
    }

    if (confirmAdminBtn) {
        confirmAdminBtn.addEventListener('click', function() {
            var password = document.getElementById('admin-password').value;
            if (password === ADMIN_PASSWORD) {
                enterAdminMode();
                adminModal.classList.remove('show');
                document.getElementById('admin-password').value = '';
            } else {
                showToast('비밀번호가 일치하지 않습니다');
            }
        });
    }

    if (exitAdminBtn) exitAdminBtn.addEventListener('click', exitAdminMode);

    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', function() {
            deleteConfirmModal.classList.remove('show');
            deleteTargetId = null;
        });
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async function() {
            if (!deleteTargetId) return;
            try {
                var response = await fetch(CONFIG.APPS_SCRIPT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify({
                        action: 'delete',
                        id: deleteTargetId,
                        adminPassword: ADMIN_PASSWORD
                    })
                });
                var result = await response.json();
                if (result.success) {
                    showToast('메시지가 삭제되었습니다');
                    deleteConfirmModal.classList.remove('show');
                    deleteTargetId = null;
                    loadAllGuestbook();
                } else {
                    showToast(result.error || '삭제에 실패했습니다');
                }
            } catch (error) {
                showToast('삭제에 실패했습니다');
            }
        });
    }

    var adminPasswordInput = document.getElementById('admin-password');
    if (adminPasswordInput) {
        adminPasswordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') confirmAdminBtn.click();
        });
    }
}

function enterAdminMode() {
    isAdminMode = true;
    var adminBanner = document.getElementById('admin-mode-banner');
    var guestbookListFull = document.getElementById('guestbook-list-full');
    if (adminBanner) adminBanner.style.display = 'flex';
    if (guestbookListFull) guestbookListFull.classList.add('admin-mode');
    showToast('관리자 모드가 활성화되었습니다');
}

function exitAdminMode() {
    isAdminMode = false;
    var adminBanner = document.getElementById('admin-mode-banner');
    var guestbookListFull = document.getElementById('guestbook-list-full');
    if (adminBanner) adminBanner.style.display = 'none';
    if (guestbookListFull) guestbookListFull.classList.remove('admin-mode');
    showToast('관리자 모드가 해제되었습니다');
}

function deleteGuestbookItem(id) {
    if (!isAdminMode) {
        showToast('관리자 모드에서만 삭제할 수 있습니다');
        return;
    }
    deleteTargetId = id;
    var modal = document.getElementById('delete-confirm-modal');
    if (modal) modal.classList.add('show');
}

// ========== 공유 버튼 ==========
function initShareButtons() {
    var btnCopyLink = document.getElementById('btn-copy-link');
    var btnKakaoShare = document.getElementById('btn-kakao-share');

    if (btnCopyLink) {
        btnCopyLink.addEventListener('click', function() {
            copyToClipboard(CONFIG.COPY_URL);
            showToast('링크가 복사되었습니다');
        });
    }

    if (btnKakaoShare) {
        btnKakaoShare.addEventListener('click', function() {
            if (typeof Kakao !== 'undefined' && Kakao.isInitialized()) {
                Kakao.Share.sendDefault({
                    objectType: 'feed',
                    content: {
                        title: '문승재 ♥ 손민지 결혼합니다',
                        description: '2026년 5월 10일 일요일 오후 12시\n에스칼라디움 3층 단독홀',
                        imageUrl: 'https://ilrabu0418.github.io/wedding/images/main.jpg',
                        link: {
                            mobileWebUrl: CONFIG.SHARE_URL,
                            webUrl: CONFIG.SHARE_URL
                        }
                    },
                    buttons: [
                        {
                            title: '청첩장 보기',
                            link: {
                                mobileWebUrl: CONFIG.SHARE_URL,
                                webUrl: CONFIG.SHARE_URL
                            }
                        }
                    ]
                });
            } else {
                showToast('카카오톡 공유를 사용할 수 없습니다');
            }
        });
    }
}

// ========== 지도 ==========
function initMap() {
    var mapContainer = document.getElementById('kakao-map');
    if (!mapContainer || typeof kakao === 'undefined') return;

    var map = new kakao.maps.Map(mapContainer, {
        center: new kakao.maps.LatLng(37.5, 126.7),
        level: 5
    });

    map.setDraggable(false);
    map.setZoomable(false);

    var overlay = document.createElement('div');
    overlay.className = 'map-touch-overlay';
    overlay.innerHTML = '<span>지도를 터치하면 활성화됩니다</span>';
    mapContainer.appendChild(overlay);

    overlay.addEventListener('click', function() {
        map.setDraggable(true);
        map.setZoomable(true);
        overlay.style.display = 'none';
    });

    document.addEventListener('click', function(e) {
        if (!mapContainer.contains(e.target)) {
            map.setDraggable(false);
            map.setZoomable(false);
            overlay.style.display = 'flex';
        }
    });

    var geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch('인천 부평구 삼산동 465-1', function(result, status) {
        if (status === kakao.maps.services.Status.OK) {
            var coords = new kakao.maps.LatLng(result[0].y, result[0].x);
            var marker = new kakao.maps.Marker({ map: map, position: coords });
            var infowindow = new kakao.maps.InfoWindow({
                content: '<div style="padding:5px;font-size:12px;">에스칼라디움</div>'
            });
            infowindow.open(map, marker);
            map.setCenter(coords);
        }
    });
}

// ========== 유틸리티 함수 ==========
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
}

function showToast(message) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(function() { toast.classList.remove('show'); }, 2500);
}

function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

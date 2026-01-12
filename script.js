// ========== 설정 ==========
const CONFIG = {
    // Google Apps Script 웹 앱 URL
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzoP2JhJpm5Jg3ZQWdaCypjjTNSJeUDeQbSyXK1fd5G-9mEbkPdPl95GwAdyy0EuNis/exec',

    // 결혼식 정보
    WEDDING_DATE: '2026-05-10', // 결혼식 날짜 (YYYY-MM-DD)
    WEDDING_TIME: '12:00',       // 결혼식 시간 (HH:MM)

    // 예식장 좌표 (에스칼라디움 - 굴포천역)
    VENUE_LAT: 37.4936,          // 위도
    VENUE_LNG: 126.7230,         // 경도
    VENUE_NAME: '에스칼라디움',
    VENUE_ADDRESS: '인천 광역시 부평구 길주로 623',

    // 카카오톡 공유 설정
    KAKAO_APP_KEY: 'YOUR_KAKAO_APP_KEY',

    // 방명록 설정
    GUESTBOOK_PREVIEW_COUNT: 3,  // 메인 페이지에 표시할 방명록 개수
    GUESTBOOK_PAGE_SIZE: 10      // 전체보기 페이지당 개수
};

// ========== 초기화 ==========
document.addEventListener('DOMContentLoaded', function() {
    // 카카오 SDK 초기화
    if (typeof Kakao !== 'undefined' && !Kakao.isInitialized()) {
        Kakao.init('bc6422965deb30a7a1ed4a95b6b6580e');
    }

    initMusicPlayer();
    initCalendar();
    initDdayCounter();
    initMap();
    initGallery();
    initGallerySlider();
    initContactToggle();
    initAccountToggle();
    initGuestbook();
    initShareButtons();
});

// ========== 배경음악 플레이어 ==========
function initMusicPlayer() {
    const bgm = document.getElementById('bgm');
    const musicBtn = document.getElementById('music-btn');

    if (!bgm || !musicBtn) return;

    let isPlaying = false;

    // 음악 재생 함수
    function playMusic() {
        bgm.play().then(() => {
            musicBtn.classList.add('playing');
            isPlaying = true;
        }).catch(error => {
            console.log('Play blocked:', error);
        });
    }

    // 음악 정지 함수
    function pauseMusic() {
        bgm.pause();
        musicBtn.classList.remove('playing');
        isPlaying = false;
    }

    // 음악 버튼 클릭 (PC & 모바일)
    musicBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // 이벤트 버블링 방지
        if (isPlaying) {
            pauseMusic();
        } else {
            playMusic();
        }
    });

    // 마우스 클릭도 추가 (PC용)
    musicBtn.addEventListener('mousedown', function(e) {
        e.stopPropagation();
    });

    // 페이지 첫 터치 시 자동 재생 (모바일)
    let firstTouch = true;
    document.addEventListener('touchstart', function() {
        if (firstTouch && !isPlaying) {
            playMusic();
            firstTouch = false;
        }
    }, { once: true });

    // 음악 종료 시 처리
    bgm.addEventListener('ended', function() {
        bgm.currentTime = 0;
        bgm.play();
    });
}

// ========== D-Day 카운터 ==========
function initDdayCounter() {
    const weddingDate = new Date(CONFIG.WEDDING_DATE + 'T' + CONFIG.WEDDING_TIME);
    const ddayElement = document.getElementById('dday-count');

    if (!ddayElement) return;

    function updateDday() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const weddingDay = new Date(CONFIG.WEDDING_DATE);
        weddingDay.setHours(0, 0, 0, 0);

        const diff = Math.ceil((weddingDay - today) / (1000 * 60 * 60 * 24));

        if (diff > 0) {
            ddayElement.textContent = `D-${diff}`;
        } else if (diff === 0) {
            ddayElement.textContent = 'D-Day';
        } else {
            ddayElement.textContent = `D+${Math.abs(diff)}`;
        }
    }

    updateDday();
}

// ========== 캘린더 ==========
function initCalendar() {
    const calendarDays = document.getElementById('calendar-days');
    if (!calendarDays) return;

    const weddingDate = new Date(CONFIG.WEDDING_DATE);
    const year = weddingDate.getFullYear();
    const month = weddingDate.getMonth();
    const weddingDay = weddingDate.getDate();

    // 해당 월의 첫째 날과 마지막 날
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // 월 표시 업데이트
    const calendarMonth = document.querySelector('.calendar-month');
    if (calendarMonth) {
        calendarMonth.textContent = `${year}년 ${month + 1}월`;
    }

    // 빈 칸 채우기 (첫째 날 이전)
    let html = '';
    for (let i = 0; i < firstDay.getDay(); i++) {
        html += '<span></span>';
    }

    // 날짜 채우기
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayOfWeek = new Date(year, month, day).getDay();
        let className = '';

        if (day === weddingDay) {
            className = 'wedding-day';
        } else if (dayOfWeek === 0) {
            className = 'sun';
        } else if (dayOfWeek === 6) {
            className = 'sat';
        }

        html += `<span class="${className}">${day}</span>`;
    }

    calendarDays.innerHTML = html;
}

// ========== 지도 ==========
function initMap() {
    const mapContainer = document.getElementById('kakao-map');
    if (!mapContainer || typeof kakao === 'undefined') return;

    // 기본 지도 생성
    const map = new kakao.maps.Map(mapContainer, {
        center: new kakao.maps.LatLng(37.5, 126.7),
        level: 5
    });

    // 처음에는 지도 조작 비활성화
    map.setDraggable(false);
    map.setZoomable(false);

    // 오버레이 추가 (클릭 안내)
    const overlay = document.createElement('div');
    overlay.className = 'map-touch-overlay';
    overlay.innerHTML = '<span>지도를 터치하면 활성화됩니다</span>';
    mapContainer.appendChild(overlay);

    // 클릭하면 활성화
    overlay.addEventListener('click', function() {
        map.setDraggable(true);
        map.setZoomable(true);
        overlay.style.display = 'none';
    });

    // 지도 바깥 클릭하면 다시 비활성화
    document.addEventListener('click', function(e) {
        if (!mapContainer.contains(e.target)) {
            map.setDraggable(false);
            map.setZoomable(false);
            overlay.style.display = 'flex';
        }
    });

    // 주소로 좌표 검색
    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch('인천 부평구 삼산동 465-1', function(result, status) {
        if (status === kakao.maps.services.Status.OK) {
            const coords = new kakao.maps.LatLng(result[0].y, result[0].x);

            // 마커 생성
            const marker = new kakao.maps.Marker({
                map: map,
                position: coords
            });

            // 인포윈도우 생성
            const infowindow = new kakao.maps.InfoWindow({
                content: '<div style="padding:5px;font-size:12px;">에스칼라디움</div>'
            });
            infowindow.open(map, marker);

            // 지도 중심 이동
            map.setCenter(coords);
        }
    });
}

// ========== 갤러리 슬라이더 ==========
function initGallerySlider() {
    const pages = document.querySelectorAll('.gallery-page');
    const dots = document.querySelectorAll('.gallery-dot');
    const slider = document.querySelector('.gallery-slider');

    if (!slider || pages.length === 0) return;

    let currentPage = 0;
    let startX = 0;
    let endX = 0;

    // 페이지 변경 함수
    function goToPage(pageIndex) {
        pages.forEach((page, i) => {
            page.classList.toggle('active', i === pageIndex);
        });
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === pageIndex);
        });
        currentPage = pageIndex;
    }

    // 점 클릭 이벤트
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const pageIndex = parseInt(dot.getAttribute('data-page'));
            goToPage(pageIndex);
        });
    });

    // 스와이프 이벤트
    slider.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    });

    slider.addEventListener('touchend', (e) => {
        endX = e.changedTouches[0].clientX;
        const diff = startX - endX;

        if (Math.abs(diff) > 50) {
            if (diff > 0 && currentPage < pages.length - 1) {
                goToPage(currentPage + 1);
            } else if (diff < 0 && currentPage > 0) {
                goToPage(currentPage - 1);
            }
        }
    });
}

// ========== 갤러리 ==========
function initGallery() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    const modal = document.getElementById('image-modal');
    const modalImage = document.getElementById('modal-image');
    const modalClose = document.querySelector('.modal-close');
    const modalPrev = document.querySelector('.modal-prev');
    const modalNext = document.querySelector('.modal-next');

    if (!modal) return;

    let currentIndex = 0;
    const images = Array.from(galleryItems).map(item => item.querySelector('img').src);

    function showImage(index) {
        currentIndex = index;
        if (currentIndex < 0) currentIndex = images.length - 1;
        if (currentIndex >= images.length) currentIndex = 0;
        modalImage.src = images[currentIndex];
    }

    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            showImage(index);
            modal.classList.add('show');
        });
    });

    if (modalClose) {
        modalClose.addEventListener('click', () => {
            modal.classList.remove('show');
        });
    }

    if (modalPrev) {
        modalPrev.addEventListener('click', () => showImage(currentIndex - 1));
    }

    if (modalNext) {
        modalNext.addEventListener('click', () => showImage(currentIndex + 1));
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });

    // 키보드 네비게이션
    document.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('show')) return;
        if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
        if (e.key === 'ArrowRight') showImage(currentIndex + 1);
        if (e.key === 'Escape') modal.classList.remove('show');
    });
}

// ========== 연락처 토글 ==========
function initContactToggle() {
    const contactToggles = document.querySelectorAll('.contact-toggle');

    contactToggles.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            const targetList = document.getElementById(targetId);

            button.classList.toggle('active');
            targetList.classList.toggle('show');
        });
    });
}

// ========== 계좌번호 토글 & 복사 ==========
function initAccountToggle() {
    const toggleButtons = document.querySelectorAll('.account-toggle');
    const copyButtons = document.querySelectorAll('.btn-copy');

    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            const targetList = document.getElementById(targetId);

            button.classList.toggle('active');
            targetList.classList.toggle('show');
        });
    });

    copyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const account = button.getAttribute('data-account');
            copyToClipboard(account);
            showToast('계좌번호가 복사되었습니다');
        });
    });
}

// ========== 방명록 ==========
function initGuestbook() {
    const form = document.getElementById('guestbook-form');
    if (form) {
        form.addEventListener('submit', handleGuestbookSubmit);
    }

    // 메인 페이지면 최신 3개만 로드
    const guestbookList = document.getElementById('guestbook-list');
    if (guestbookList) {
        loadGuestbook(CONFIG.GUESTBOOK_PREVIEW_COUNT);
    }
}

async function handleGuestbookSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('gb-name').value.trim();
    const message = document.getElementById('gb-message').value.trim();

    if (!name || !message) {
        showToast('모든 항목을 입력해주세요');
        return;
    }

    try {
        const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify({
                action: 'write',
                name: name,
                message: message
            })
        });

        const result = await response.json();
        if (result.success) {
            showToast('축하 메시지가 등록되었습니다');
            e.target.reset();
        } else {
            showToast(result.error || '등록에 실패했습니다');
            return;
        }

        // 방명록 새로고침
        const guestbookList = document.getElementById('guestbook-list');
        const guestbookListFull = document.getElementById('guestbook-list-full');

        if (guestbookList) {
            loadGuestbook(CONFIG.GUESTBOOK_PREVIEW_COUNT);
        }
        if (guestbookListFull) {
            loadAllGuestbook();
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('등록에 실패했습니다. 다시 시도해주세요');
    }
}

async function loadGuestbook(limit) {
    const guestbookList = document.getElementById('guestbook-list');
    if (!guestbookList) return;

    try {
        const response = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=read&limit=${limit}`);
        const data = await response.json();

        if (data.success && data.data.length > 0) {
            guestbookList.innerHTML = data.data.map(item => createGuestbookItem(item)).join('');
        } else {
            guestbookList.innerHTML = '<p class="no-message">아직 등록된 메시지가 없습니다</p>';
        }
    } catch (error) {
        console.error('Error loading guestbook:', error);
        // 테스트용 더미 데이터
        guestbookList.innerHTML = `
            <div class="guestbook-item">
                <div class="guestbook-item-header">
                    <span class="guestbook-name">홍길동</span>
                    <span class="guestbook-date">2026.01.01</span>
                </div>
                <p class="guestbook-message">결혼 축하해요! 행복하게 잘 살아~</p>
            </div>
        `;
    }
}

async function loadAllGuestbook(page = 1) {
    const guestbookListFull = document.getElementById('guestbook-list-full');
    const totalCountEl = document.getElementById('total-count');
    const paginationEl = document.getElementById('pagination');

    if (!guestbookListFull) return;

    try {
        const response = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=readAll&page=${page}&pageSize=${CONFIG.GUESTBOOK_PAGE_SIZE}`);
        const data = await response.json();

        if (data.success) {
            if (totalCountEl) {
                totalCountEl.textContent = data.total;
            }

            if (data.data.length > 0) {
                guestbookListFull.innerHTML = data.data.map(item => createGuestbookItem(item, true)).join('');
            } else {
                guestbookListFull.innerHTML = '<p class="no-message">아직 등록된 메시지가 없습니다</p>';
            }

            // 페이지네이션 생성
            if (paginationEl && data.totalPages > 1) {
                let paginationHtml = '';
                for (let i = 1; i <= data.totalPages; i++) {
                    paginationHtml += `<button class="${i === page ? 'active' : ''}" onclick="loadAllGuestbook(${i})">${i}</button>`;
                }
                paginationEl.innerHTML = paginationHtml;
            }
        }
    } catch (error) {
        console.error('Error loading guestbook:', error);
    }
}

function createGuestbookItem(item, showDelete = false) {
    const deleteButton = showDelete ?
        `<button class="guestbook-delete" onclick="deleteGuestbookItem('${item.id}')">삭제</button>` : '';

    return `
        <div class="guestbook-item" data-id="${item.id}">
            <div class="guestbook-item-header">
                <span class="guestbook-name">${escapeHtml(item.name)}</span>
                <span class="guestbook-date">${item.date}</span>
            </div>
            <p class="guestbook-message">${escapeHtml(item.message)}</p>
            ${deleteButton}
        </div>
    `;
}

// ========== 관리자 모드 ==========
const ADMIN_PASSWORD = '0130';
let isAdminMode = false;
let deleteTargetId = null;
let settingsClickCount = 0;
let settingsClickTimer = null;

function initAdminMode() {
    const settingsBtn = document.getElementById('btn-settings');
    const adminModal = document.getElementById('admin-modal');
    const cancelAdminBtn = document.getElementById('btn-cancel-admin');
    const confirmAdminBtn = document.getElementById('btn-confirm-admin');
    const exitAdminBtn = document.getElementById('btn-exit-admin');
    const adminBanner = document.getElementById('admin-mode-banner');
    const deleteConfirmModal = document.getElementById('delete-confirm-modal');
    const cancelDeleteBtn = document.getElementById('btn-cancel-delete');
    const confirmDeleteBtn = document.getElementById('btn-confirm-delete');

    // 설정 버튼 3번 연속 클릭 - 관리자 모드 진입 모달
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            if (isAdminMode) {
                exitAdminMode();
                return;
            }

            settingsClickCount++;

            // 타이머 초기화
            if (settingsClickTimer) {
                clearTimeout(settingsClickTimer);
            }

            // 3번 클릭 시 모달 열기
            if (settingsClickCount >= 3) {
                settingsClickCount = 0;
                adminModal.classList.add('show');
            } else {
                // 1초 내에 클릭하지 않으면 카운트 초기화
                settingsClickTimer = setTimeout(() => {
                    settingsClickCount = 0;
                }, 1000);
            }
        });
    }

    // 관리자 모달 취소
    if (cancelAdminBtn) {
        cancelAdminBtn.addEventListener('click', () => {
            adminModal.classList.remove('show');
            document.getElementById('admin-password').value = '';
        });
    }

    // 관리자 비밀번호 확인
    if (confirmAdminBtn) {
        confirmAdminBtn.addEventListener('click', () => {
            const password = document.getElementById('admin-password').value;
            if (password === ADMIN_PASSWORD) {
                enterAdminMode();
                adminModal.classList.remove('show');
                document.getElementById('admin-password').value = '';
            } else {
                showToast('비밀번호가 일치하지 않습니다');
            }
        });
    }

    // 관리자 모드 해제 버튼
    if (exitAdminBtn) {
        exitAdminBtn.addEventListener('click', exitAdminMode);
    }

    // 삭제 확인 모달 - 취소
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            deleteConfirmModal.classList.remove('show');
            deleteTargetId = null;
        });
    }

    // 삭제 확인 모달 - 삭제 실행
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (!deleteTargetId) return;

            try {
                const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain',
                    },
                    body: JSON.stringify({
                        action: 'delete',
                        id: deleteTargetId,
                        adminPassword: ADMIN_PASSWORD
                    })
                });

                const result = await response.json();
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

    // Enter 키로 비밀번호 확인
    const adminPasswordInput = document.getElementById('admin-password');
    if (adminPasswordInput) {
        adminPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                confirmAdminBtn.click();
            }
        });
    }
}

function enterAdminMode() {
    isAdminMode = true;
    const adminBanner = document.getElementById('admin-mode-banner');
    const guestbookListFull = document.getElementById('guestbook-list-full');

    if (adminBanner) adminBanner.style.display = 'flex';
    if (guestbookListFull) guestbookListFull.classList.add('admin-mode');

    showToast('관리자 모드가 활성화되었습니다');
}

function exitAdminMode() {
    isAdminMode = false;
    const adminBanner = document.getElementById('admin-mode-banner');
    const guestbookListFull = document.getElementById('guestbook-list-full');

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
    const modal = document.getElementById('delete-confirm-modal');
    if (modal) {
        modal.classList.add('show');
    }
}

// ========== 참석 의사 전달 ==========
function initAttendanceForm() {
    const form = document.getElementById('attendance-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = {
            action: 'attendance',
            name: formData.get('name'),
            side: formData.get('side'),
            count: formData.get('count'),
            meal: formData.get('meal')
        };

        try {
            await fetch(CONFIG.APPS_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            showToast('참석 의사가 전달되었습니다');
            form.reset();
        } catch (error) {
            showToast('전송에 실패했습니다. 다시 시도해주세요');
        }
    });
}

// ========== 공유 버튼 ==========
function initShareButtons() {
    const btnAddCalendar = document.getElementById('btn-add-calendar');
    const btnCopyLink = document.getElementById('btn-copy-link');
    const btnKakaoShare = document.getElementById('btn-kakao-share');

    // 일정 등록 (ICS 파일 - 기본 캘린더 앱으로 열림)
    if (btnAddCalendar) {
        btnAddCalendar.addEventListener('click', () => {
            const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Wedding//Invitation//KO
BEGIN:VEVENT
UID:wedding-2026-05-10@invitation
DTSTART:20260510T030000Z
DTEND:20260510T050000Z
SUMMARY:문승재 ♥ 손민지 결혼식
LOCATION:에스칼라디움 3층 단독홀, 인천 부평구 삼산동 465-1
DESCRIPTION:문승재 ♥ 손민지 결혼식에 초대합니다.
END:VEVENT
END:VCALENDAR`;

            const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = 'wedding.ics';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showToast('캘린더에 추가하려면 다운로드된 파일을 열어주세요');
        });
    }

    // 링크 복사
    if (btnCopyLink) {
        btnCopyLink.addEventListener('click', () => {
            copyToClipboard(window.location.href);
            showToast('링크가 복사되었습니다');
        });
    }

    // 카카오톡 공유
    if (btnKakaoShare) {
        btnKakaoShare.addEventListener('click', () => {
            if (typeof Kakao !== 'undefined' && Kakao.isInitialized()) {
                Kakao.Share.sendDefault({
                    objectType: 'feed',
                    content: {
                        title: '문승재 ♥ 손민지 결혼합니다',
                        description: '2026년 5월 10일 일요일 오후 12시\n에스칼라디움 3층 단독홀',
                        imageUrl: window.location.href + 'images/main.jpg',
                        link: {
                            mobileWebUrl: window.location.href,
                            webUrl: window.location.href
                        }
                    },
                    buttons: [
                        {
                            title: '청첩장 보기',
                            link: {
                                mobileWebUrl: window.location.href,
                                webUrl: window.location.href
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

// ========== 유틸리티 함수 ==========
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

function formatDateForICS(date) {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

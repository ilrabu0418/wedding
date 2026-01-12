// ========== 설정 ==========
const CONFIG = {
    // Google Apps Script 웹 앱 URL (나중에 설정)
    APPS_SCRIPT_URL: 'YOUR_GOOGLE_APPS_SCRIPT_URL',

    // 결혼식 정보
    WEDDING_DATE: '2026-05-10', // 결혼식 날짜 (YYYY-MM-DD)
    WEDDING_TIME: '12:00',       // 결혼식 시간 (HH:MM)

    // 예식장 좌표 (에스칼라디움 - 굴포천역)
    VENUE_LAT: 37.5050,          // 위도
    VENUE_LNG: 126.7227,         // 경도
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
    initCalendar();
    initDdayCounter();
    initMap();
    initGallery();
    initAccountToggle();
    initGuestbook();
    initShareButtons();
    initAttendanceForm();
});

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
// 지도는 링크 방식으로 연결 (API 키 불필요)
function initMap() {
    // 링크는 HTML에 직접 설정됨
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
    const password = document.getElementById('gb-password').value;
    const message = document.getElementById('gb-message').value.trim();

    if (!name || !password || !message) {
        showToast('모든 항목을 입력해주세요');
        return;
    }

    try {
        const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'write',
                name: name,
                password: password,
                message: message
            })
        });

        showToast('축하 메시지가 등록되었습니다');
        e.target.reset();

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

let deleteTargetId = null;

function deleteGuestbookItem(id) {
    deleteTargetId = id;
    const modal = document.getElementById('delete-modal');
    if (modal) {
        modal.classList.add('show');
    }
}

// 삭제 모달 이벤트 (guestbook.html에서 사용)
document.addEventListener('DOMContentLoaded', function() {
    const cancelBtn = document.getElementById('btn-cancel-delete');
    const confirmBtn = document.getElementById('btn-confirm-delete');
    const deleteModal = document.getElementById('delete-modal');

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            deleteModal.classList.remove('show');
            deleteTargetId = null;
        });
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            const password = document.getElementById('delete-password').value;
            if (!password) {
                showToast('비밀번호를 입력해주세요');
                return;
            }

            try {
                const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'delete',
                        id: deleteTargetId,
                        password: password
                    })
                });

                showToast('메시지가 삭제되었습니다');
                deleteModal.classList.remove('show');
                loadAllGuestbook();
            } catch (error) {
                showToast('삭제에 실패했습니다');
            }
        });
    }
});

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

    // 일정 등록 (ICS 파일 생성)
    if (btnAddCalendar) {
        btnAddCalendar.addEventListener('click', () => {
            const weddingDateTime = new Date(CONFIG.WEDDING_DATE + 'T' + CONFIG.WEDDING_TIME);
            const endDateTime = new Date(weddingDateTime.getTime() + 2 * 60 * 60 * 1000); // 2시간 후

            const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${formatDateForICS(weddingDateTime)}
DTEND:${formatDateForICS(endDateTime)}
SUMMARY:결혼식
LOCATION:${CONFIG.VENUE_NAME}
DESCRIPTION:${CONFIG.VENUE_ADDRESS}
END:VEVENT
END:VCALENDAR`;

            const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'wedding.ics';
            link.click();

            showToast('캘린더 파일이 다운로드됩니다');
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
                        title: '신랑이름 ♥ 신부이름 결혼합니다',
                        description: CONFIG.WEDDING_DATE + ' ' + CONFIG.WEDDING_TIME + '\n' + CONFIG.VENUE_NAME,
                        imageUrl: window.location.origin + '/images/main.jpg',
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

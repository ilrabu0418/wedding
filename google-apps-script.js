/**
 * Google Apps Script - 모바일 청첩장 방명록 & 참석 의사 API
 *
 * 설정 방법:
 * 1. Google Drive에서 새 스프레드시트 생성
 * 2. 시트 이름을 "방명록", "참석" 두 개로 설정
 * 3. 확장 프로그램 > Apps Script 클릭
 * 4. 아래 코드 전체 복사하여 붙여넣기
 * 5. 저장 후 "배포" > "새 배포" 클릭
 * 6. 유형: "웹 앱" 선택
 * 7. 실행 주체: "나"
 * 8. 액세스 권한: "모든 사용자"
 * 9. 배포 후 생성된 URL을 script.js의 APPS_SCRIPT_URL에 입력
 */

// 스프레드시트 ID (URL에서 /d/ 와 /edit 사이의 문자열)
const SPREADSHEET_ID = '1bfNvMBa04qHVmjSxmUjW49MvEdPMaoFk8wzbVBDJAH4';

// 시트 이름
const GUESTBOOK_SHEET = '방명록';
const ATTENDANCE_SHEET = '참석';

// CORS 헤더 설정
function doOptions(e) {
    return ContentService.createTextOutput('')
        .setMimeType(ContentService.MimeType.TEXT);
}

// GET 요청 처리 (방명록 조회)
function doGet(e) {
    const action = e.parameter.action;

    let result;

    switch (action) {
        case 'read':
            result = readGuestbook(parseInt(e.parameter.limit) || 3);
            break;
        case 'readAll':
            result = readAllGuestbook(
                parseInt(e.parameter.page) || 1,
                parseInt(e.parameter.pageSize) || 10
            );
            break;
        default:
            result = { success: false, error: 'Invalid action' };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
}

// POST 요청 처리 (방명록 작성/삭제, 참석 의사)
function doPost(e) {
    let data;

    try {
        data = JSON.parse(e.postData.contents);
    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: 'Invalid JSON'
        })).setMimeType(ContentService.MimeType.JSON);
    }

    let result;

    switch (data.action) {
        case 'write':
            result = writeGuestbook(data.name, data.message);
            break;
        case 'delete':
            result = deleteGuestbook(data.id, data.adminPassword);
            break;
        case 'attendance':
            result = writeAttendance(data.name, data.side, data.count, data.meal);
            break;
        default:
            result = { success: false, error: 'Invalid action' };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
}

// 관리자 비밀번호
const ADMIN_PASSWORD = '0130';

// ========== 방명록 함수 ==========

// 방명록 조회 (최신 N개)
function readGuestbook(limit) {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(GUESTBOOK_SHEET);
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
        return { success: true, data: [] };
    }

    const startRow = Math.max(2, lastRow - limit + 1);
    const numRows = lastRow - startRow + 1;
    const data = sheet.getRange(startRow, 1, numRows, 4).getValues();

    const result = data.reverse().map(row => ({
        id: row[0],
        name: row[1],
        message: row[2],
        date: formatDate(row[3])
    }));

    return { success: true, data: result };
}

// 방명록 전체 조회 (페이지네이션)
function readAllGuestbook(page, pageSize) {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(GUESTBOOK_SHEET);
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
        return { success: true, data: [], total: 0, totalPages: 0 };
    }

    const total = lastRow - 1;
    const totalPages = Math.ceil(total / pageSize);
    const allData = sheet.getRange(2, 1, total, 4).getValues();

    // 최신순 정렬
    allData.reverse();

    // 페이지네이션
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageData = allData.slice(start, end);

    const result = pageData.map(row => ({
        id: row[0],
        name: row[1],
        message: row[2],
        date: formatDate(row[3])
    }));

    return {
        success: true,
        data: result,
        total: total,
        totalPages: totalPages,
        currentPage: page
    };
}

// 방명록 작성 (비밀번호 없이)
function writeGuestbook(name, message) {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(GUESTBOOK_SHEET);

    // 헤더가 없으면 추가
    if (sheet.getLastRow() === 0) {
        sheet.appendRow(['ID', '이름', '메시지', '작성일']);
    }

    const id = Utilities.getUuid();
    const date = new Date();

    sheet.appendRow([id, name, message, date]);

    return { success: true, id: id };
}

// 방명록 삭제 (관리자 비밀번호로만 삭제)
function deleteGuestbook(id, adminPassword) {
    // 관리자 비밀번호 확인
    if (adminPassword !== ADMIN_PASSWORD) {
        return { success: false, error: '관리자 비밀번호가 일치하지 않습니다' };
    }

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(GUESTBOOK_SHEET);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === id) {
            sheet.deleteRow(i + 1);
            return { success: true };
        }
    }

    return { success: false, error: '메시지를 찾을 수 없습니다' };
}

// ========== 참석 의사 함수 ==========

function writeAttendance(name, side, count, meal) {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ATTENDANCE_SHEET);

    // 헤더가 없으면 추가
    if (sheet.getLastRow() === 0) {
        sheet.appendRow(['이름', '신랑/신부측', '인원', '식사여부', '등록일']);
    }

    const sideText = side === 'groom' ? '신랑측' : '신부측';
    const mealText = meal === 'yes' ? '예정' : '미정';
    const date = new Date();

    sheet.appendRow([name, sideText, count, mealText, date]);

    return { success: true };
}

// ========== 유틸리티 함수 ==========

function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
}

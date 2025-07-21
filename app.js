/* app.js */

/* 전역 상수 및 설정 */
const MEMBER_LIST = [
  {id:"Gunil", display:"건일 선배"},
  {id:"Jeongsu", display:"정수"},
  {id:"Gaon", display:"지석"},
  {id:"Ode", display:"뜽이"},
  {id:"Junhan", display:"자영"},
  {id:"Jooyeon", display:"쭈쿠나쭈타타"},
];

/* 유틸리티 함수 */
function qs(sel,root=document){return root.querySelector(sel);}
function qsa(sel,root=document){return [...root.querySelectorAll(sel)];}
function getParam(name){
  const p=new URLSearchParams(location.search);
  return p.get(name);
}
function getNickname(){
  return localStorage.getItem("fanNickname") || "";
}
function setNickname(nick){
  localStorage.setItem("fanNickname", nick);
}
function getMemberDisplay(id){
  const m = MEMBER_LIST.find(x=>x.id===id);
  return m ? m.display : id;
}
function profileSrc(id){
  return `images/${id}_profile.jpg`;
}
function backgroundSrc(id){
  return `images/${id}_background.jpg`;
}
function chatDataSrc(id){
  const username = 'Joo-is-my-life';
  const repoName = 'test';
  const branch = 'main';
  return `https://raw.githubusercontent.com/${username}/${repoName}/${branch}/data/${id}.csv`;
}

function historyDataSrc(memberId, type){
  const username = 'Joo-is-my-life';
  const repoName = 'test';
  const branch = 'main';
  return `https://raw.githubusercontent.com/${username}/${repoName}/${branch}/data/${type}/${memberId}.csv`;
}

function formatDateK(dateStr){
  const d = new Date(dateStr);
  if(!isNaN(d.getTime())){
    const y=d.getFullYear();
    const m=d.getMonth()+1;
    const day=d.getDate();
    const weekday=["일","월","화","수","목","금","토"][d.getDay()];
    return `${y}년 ${m}월 ${day}일 ${weekday}요일`;
  }
  return dateStr;
}

/* 아카이브 페이지 초기화 */
function initArchive(){
  const listEl = qs("#archiveList");
  if(!listEl) return;
  MEMBER_LIST.forEach(m=>{
    const row=document.createElement("a");
    row.className="archive-row";
    row.href=`member.html?m=${m.id}`;
    row.innerHTML=`
      <span class="archive-row-avatar-wrap">
        <img class="archive-row-avatar" src="${profileSrc(m.id)}" alt="${m.display}"
             onerror="this.src='images/default_profile.jpg'">
      </span>
      <span class="archive-row-name">${m.display}</span>
      <span class="archive-row-status"> </span>
    `;
    listEl.appendChild(row);
  });
}

/* 멤버 프로필 페이지 초기화 */
async function initMember(){
  const id=getParam("m");
  if(!id) {
    console.warn("Member ID not found in URL for member.html");
    return;
  }
  const disp=getMemberDisplay(id);
  const bg=qs("#memberBg");
  const prof=qs("#memberProfile");
  const nameEl=qs("#memberDisplayName");
  const btn=qs("#viewChatBtn");

  if(bg) {
    bg.src=backgroundSrc(id);
    bg.onerror=()=>{bg.src="images/default_background.jpg";}

    try {
        const res = await fetch(historyDataSrc(id, 'background'));
        let historyData = [];
        if(res.ok) {
            const csvText = await res.text();
            const rawHistory = parseCsv(csvText);
            const sortedHistory = rawHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
            historyData = sortedHistory.map(item => ({ ...item, type_orig: 'background', type: getMediaType(item.path) }));
        } else if (res.status === 404) {
             console.warn(`No background history CSV found for ${id}. Using current image only.`);
        } else {
            console.error(`Failed to load background history for ${id}. Status: ${res.status}`);
        }

        if (historyData.length > 0) {
            bg.src = historyData[0].path;
        }

        // ⭐ 기존 배경 이미지 클릭 이벤트 수정 ⭐
        bg.addEventListener("click", () => {
            if (historyData.length > 0) {
                // 히스토리가 있다면 최신 이미지부터 팝업 열기
                openMediaModal(historyData[0].path, historyData[0].type, historyData, 0);
            } else {
                // 히스토리가 없다면 현재 배경 이미지만으로 팝업 열기
                openMediaModal(bg.src, getMediaType(bg.src), [{ path: bg.src, type: getMediaType(bg.src), type_orig: 'background' }], 0);
            }
        });
    } catch (error) {
        console.error("Error loading background history:", error);
        // 오류 발생 시에도 현재 이미지로 팝업을 열 수 있도록 폴백 처리
        if (bg) {
            bg.addEventListener("click", () => {
                openMediaModal(bg.src, getMediaType(bg.src), [{ path: bg.src, type: getMediaType(bg.src), type_orig: 'background' }], 0);
            });
        }
    }
  }

  if(prof){
    prof.src=profileSrc(id);
    prof.onerror=()=>{prof.src="images/default_profile.jpg";}

    try {
        const res = await fetch(historyDataSrc(id, 'profile'));
        let historyData = [];
        if(res.ok) {
            const csvText = await res.text();
            const rawHistory = parseCsv(csvText);
            const sortedHistory = rawHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
            historyData = sortedHistory.map(item => ({ ...item, type_orig: 'profile', type: getMediaType(item.path) }));
        } else if (res.status === 404) {
            console.warn(`No profile history CSV found for ${id}. Using current image only.`);
        } else {
            console.error(`Failed to load profile history for ${id}. Status: ${res.status}`);
        }

        if (historyData.length > 0) {
            prof.src = historyData[0].path;
        }

        // ⭐ 기존 프로필 이미지 클릭 이벤트 수정 ⭐
        prof.addEventListener("click", () => {
            if (historyData.length > 0) {
                // 히스토리가 있다면 최신 이미지부터 팝업 열기
                openMediaModal(historyData[0].path, historyData[0].type, historyData, 0);
            } else {
                // 히스토리가 없다면 현재 프로필 이미지만으로 팝업 열기
                openMediaModal(prof.src, getMediaType(prof.src), [{ path: prof.src, type: getMediaType(prof.src), type_orig: 'profile' }], 0);
            }
        });
    } catch (error) {
        console.error("Error loading profile history:", error);
        // 오류 발생 시에도 현재 이미지로 팝업을 열 수 있도록 폴백 처리
        if (prof) {
            prof.addEventListener("click", () => {
                openMediaModal(prof.src, getMediaType(prof.src), [{ path: prof.src, type: getMediaType(prof.src), type_orig: 'profile' }], 0);
            });
        }
    }
  }

  if(nameEl) nameEl.textContent=disp;
  if(btn){
    btn.addEventListener("click",()=>{ location.href=`chat.html?m=${id}`; });
  }
}

/* 채팅 페이지 초기화 */
let currentMemberId=null;
function initChat(){
  const id=getParam("m");
  if(!id) {
    console.warn("Member ID not found in URL for chat.html");
    return;
  }
  currentMemberId=id;
  const disp=getMemberDisplay(id);
  const titleEl=qs("#chatMemberName");
  if(titleEl) titleEl.textContent=disp;

  openNickModal(); // 닉네임 유무와 상관없이 항상 모달을 띄움
}

// CSV 텍스트를 파싱하여 JSON 객체 배열로 변환
function parseCsv(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = [];
    let inQuote = false;
    let currentVal = '';
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"' && (j === 0 || line[j-1] === ',' || inQuote)) {
        if (inQuote && j + 1 < line.length && line[j+1] === '"') {
          currentVal += '"';
          j++;
        } else {
          inQuote = !inQuote;
        }
      } else if (char === ',' && !inQuote) {
        values.push(currentVal.trim());
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] !== undefined ? values[index].trim() : '';
    });
    result.push(row);
  }
  return result;
}


// ⭐ 추가: 미디어 모달 관련 DOM 요소 참조 변수 ⭐
const mediaModal = qs("#mediaModal");
const closeMediaModalBtn = qs("#closeMediaModal");
const modalImage = qs("#modalImage");
const modalVideo = qs("#modalVideo");
const downloadMediaBtn = qs("#downloadMediaBtn");
const prevMediaBtn = qs("#prevMediaBtn");
const nextMediaBtn = qs("#nextMediaBtn");

let currentMediaHistory = [];
let currentMediaIndex = 0;

// ⭐ 추가: 파일 경로를 기반으로 미디어 타입(이미지/비디오)을 결정하는 함수 ⭐
function getMediaType(path) {
    if (/\.(mp4|mov|webm|ogg)$/i.test(path)) {
        return 'video';
    } else if (/\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(path)) {
        return 'image';
    }
    return 'unknown';
}

// ⭐ 추가: 미디어 팝업을 여는 함수 ⭐
function openMediaModal(mediaUrl, mediaType, historyData = [], initialIndex = 0) {
    if (!mediaModal || !modalImage || !modalVideo || !downloadMediaBtn) {
        console.error("미디어 모달 관련 DOM 요소를 찾을 수 없습니다. member.html에 mediaModal 구조가 있는지 확인해주세요.");
        return;
    }

    modalImage.style.display = 'none';
    modalVideo.style.display = 'none';
    modalVideo.pause(); // 비디오 재생 중지

    currentMediaHistory = historyData; // 현재 히스토리 데이터 설정
    currentMediaIndex = initialIndex; // 초기 인덱스 설정

    updateMediaModalContent(); // 모달 내용 업데이트

    mediaModal.classList.remove('hidden'); // hidden 클래스 제거하여 모달 표시
    document.body.style.overflow = 'hidden'; // 배경 스크롤 방지

    updateMediaNavButtons(); // 이전/다음 버튼 상태 업데이트
}

// ⭐ 추가: 미디어 팝업 콘텐츠를 업데이트하는 함수 ⭐
function updateMediaModalContent() {
    const mediaItem = currentMediaHistory[currentMediaIndex];
    if (!mediaItem) {
        console.error("Invalid media history item or index:", currentMediaIndex, currentMediaHistory);
        return;
    }

    modalImage.style.display = 'none';
    modalVideo.style.display = 'none';
    modalVideo.pause();
    modalVideo.currentTime = 0; // 비디오 초기화

    if (mediaItem.type === 'image' || mediaItem.type_orig === 'image') { // type_orig도 확인
        modalImage.src = mediaItem.path;
        modalImage.style.display = 'block';
    } else if (mediaItem.type === 'video' || mediaItem.type_orig === 'video') { // type_orig도 확인
        modalVideo.src = mediaItem.path;
        modalVideo.style.display = 'block';
        modalVideo.load(); // 비디오 로드
    } else {
        console.warn("Unknown media type or missing path in history item:", mediaItem);
    }

    downloadMediaBtn.href = mediaItem.path;
    const fileName = mediaItem.path.split('/').pop().split('?')[0];
    downloadMediaBtn.download = fileName; // 다운로드 파일명 설정
}

// ⭐ 추가: 미디어 팝업 이전/다음 버튼 상태를 업데이트하는 함수 ⭐
function updateMediaNavButtons() {
    if (prevMediaBtn) {
        prevMediaBtn.disabled = currentMediaIndex === 0; // 첫 번째 미디어면 이전 버튼 비활성화
    }
    if (nextMediaBtn) {
        nextMediaBtn.disabled = currentMediaIndex === currentMediaHistory.length - 1; // 마지막 미디어면 다음 버튼 비활성화
    }
}

// ⭐ 추가: 다음 미디어를 보여주는 함수 ⭐
function showNextMedia() {
    if (currentMediaIndex < currentMediaHistory.length - 1) {
        currentMediaIndex++;
        updateMediaModalContent();
        updateMediaNavButtons();
    }
}

// ⭐ 추가: 이전 미디어를 보여주는 함수 ⭐
function showPrevMedia() {
    if (currentMediaIndex > 0) {
        currentMediaIndex--;
        updateMediaModalContent();
        updateMediaNavButtons();
    }
}

// ⭐ 추가: 미디어 팝업을 닫는 함수 ⭐
function closeMediaModal() {
    if (mediaModal) {
        mediaModal.classList.add('hidden'); // hidden 클래스 추가하여 모달 숨김
        modalImage.src = ''; // 이미지 src 초기화
        modalVideo.src = ''; // 비디오 src 초기화
        modalVideo.pause();
        modalVideo.currentTime = 0;
        document.body.style.overflow = ''; // 배경 스크롤 허용
        currentMediaHistory = []; // 히스토리 초기화
        currentMediaIndex = 0; // 인덱스 초기화
    }
}

function renderChat(box, data, memberId){
  box.innerHTML="";
  const fanNick=getNickname() || "빌런즈";
  let lastDate=null;
  data.forEach(msg=>{
    if(msg.date && msg.date!==lastDate){
      const sep=document.createElement("div");
      sep.className="chat-date-sep";
      sep.textContent=formatDateK(msg.date);
      box.appendChild(sep);
      lastDate=msg.date;
    }
    
    const msgWrap = document.createElement("div");
    msgWrap.className = "chat-msg-wrap";

    const msgContent = document.createElement("div");
    msgContent.className = `chat-msg artist`;

    let mediaUrl = null;
    let mediaType = null;

    if (msg.type === 'image' && msg.media) {
      const img = document.createElement("img");
      img.src = msg.media;
      img.alt = "채팅 이미지";
      img.className = "chat-media-image";
      msgContent.appendChild(img);
      mediaUrl = msg.media;
      mediaType = 'image';
    } else if (msg.type === 'video' && msg.media) {
      const video = document.createElement("video");
      video.src = msg.media;
      video.controls = true;
      video.className = "chat-media-video";
      msgContent.appendChild(video);
      mediaUrl = msg.media;
      mediaType = 'video';
    } else if (msg.text && msg.text.trim() !== '') {
      const msgText = document.createTextNode(msg.text.replace(/\(name\)/g, fanNick));
      msgContent.appendChild(msgText);
    } else {
      console.warn("Skipping message with no content:", msg);
      return;
    }

    // ⭐ 채팅 메시지 내 이미지/동영상 클릭 이벤트 추가 ⭐
    if (mediaUrl) {
        msgContent.style.cursor = 'pointer'; // 클릭 가능 시 커서 변경
        msgContent.addEventListener('click', () => {
            // 채팅 내 미디어는 히스토리 없이 단일 미디어로 팝업
            openMediaModal(mediaUrl, mediaType, [{ path: mediaUrl, type: mediaType, type_orig: 'chat' }], 0);
        });
    }

    msgWrap.appendChild(msgContent);
    
    if (msg.time) {
      const meta = document.createElement("div");
      meta.className = "chat-meta";
      meta.textContent = msg.time;
      msgWrap.appendChild(meta);
    }
    
    box.appendChild(msgWrap);
  });
  box.scrollTop = box.scrollHeight;
}


async function loadChatData(id){
  const box=qs("#chatScroll");
  if(!box) return;
  box.innerHTML="<div class='chat-date-sep'>채팅 데이터 불러오는 중...</div>";
  try{
    const res=await fetch(chatDataSrc(id));
    if(!res.ok) {
      let errorMessage = `데이터를 불러올 수 없어요. (오류 코드: ${res.status})`;
      if (res.status === 404) {
        errorMessage = `데이터 파일이 없거나 경로가 잘못되었습니다. (${id}.csv 확인)`;
      } else if (res.status >= 500) {
        errorMessage = `서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.`;
      }
      throw new Error(errorMessage);
    }
    const csvText = await res.text();
    const data = parseCsv(csvText);
    if (data.length === 0) {
      box.innerHTML = "<div class='chat-date-sep'>아직 채팅 데이터가 없어요.</div>";
      return;
    }
    renderChat(box, data, id);
  }catch(err){
    box.innerHTML=`<div class='chat-date-sep'>${err.message || "알 수 없는 오류가 발생했어요."}</div>`;
    console.error("Failed to load chat data:", err);
  }
}


/* 닉네임 설정 모달 관련 함수 */
function openNickModal(){
  const m=qs("#nickModal");
  if(m) m.classList.remove("hidden");
  const inp=qs("#nickInput");
  if(inp) inp.focus();
}
function closeNickModal(){
  const m=qs("#nickModal");
  if(m) m.classList.add("hidden");
}
function saveNickname(){
  const inp=qs("#nickInput");
  const nick=(inp?.value||"").trim();
  if(nick){
    setNickname(nick);
    closeNickModal();
    if(currentMemberId){
      loadChatData(currentMemberId);
    }
  } else {
    alert("닉네임을 입력해주세요!");
  }
}


/* 페이지 로드 시 초기화 함수 실행 */
document.addEventListener("DOMContentLoaded",()=>{
  const path=location.pathname;
  if(path.endsWith("index.html") || path.endsWith("/")){
    initArchive();
  }else if(path.endsWith("member.html")){
    initMember();
  }else if(path.endsWith("chat.html")){
    initChat();
  }
  // ⭐ 추가: 미디어 팝업 버튼 이벤트 리스너 연결 ⭐
  if (closeMediaModalBtn) {
    closeMediaModalBtn.addEventListener('click', closeMediaModal);
  }
  if (mediaModal) {
    // 모달 배경 클릭 시 닫기
    mediaModal.addEventListener('click', (e) => {
        if (e.target === mediaModal) {
            closeMediaModal();
        }
    });
  }
  if (prevMediaBtn) {
    prevMediaBtn.addEventListener('click', showPrevMedia);
  }
  if (nextMediaBtn) {
    nextMediaBtn.addEventListener('click', showNextMedia);
  }
});

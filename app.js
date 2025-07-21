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

/* 멤버 프로필 페이지 초기화 (member.html) */
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

  // 배경 이미지 및 히스토리 데이터 로딩 (기존 미디어 모달 사용)
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

        // 배경 이미지 클릭 시 팝업 열기 (기존 미디어 모달 사용)
        bg.addEventListener("click", () => {
            if (historyData.length > 0) {
                openMediaModal(historyData[0].path, historyData[0].type, historyData, 0);
            } else {
                openMediaModal(bg.src, getMediaType(bg.src), [{ path: bg.src, type: getMediaType(bg.src), type_orig: 'background' }], 0);
            }
        });
    } catch (error) {
        console.error("Error loading background history:", error);
        if (bg) {
            bg.addEventListener("click", () => {
                openMediaModal(bg.src, getMediaType(bg.src), [{ path: bg.src, type: getMediaType(bg.src), type_orig: 'background' }], 0);
            });
        }
    }
  }

  // 프로필 이미지 및 히스토리 데이터 로딩
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

        // ⭐ 프로필 이미지 클릭 시 새 'view.html' 페이지로 이동 ⭐
        prof.addEventListener("click", () => {
            location.href = `view.html?m=${id}`; // 새 페이지로 이동
        });
    } catch (error) {
        console.error("Error loading profile history:", error);
        // 오류 발생 시에도 새 페이지로 이동하도록 폴백 처리
        if (prof) {
            prof.addEventListener("click", () => {
                location.href = `view.html?m=${id}`;
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

// ⭐ 상세 보기 페이지 (view.html) 초기화 ⭐
async function initView() {
    const id = getParam("m");
    if (!id) {
        console.warn("Member ID not found in URL for view.html");
        return;
    }
    const disp = getMemberDisplay(id);

    const detailBg = qs("#viewBackground");
    const detailProf = qs("#viewProfile");
    const detailNameEl = qs("#viewDisplayName");

    // 배경 이미지 설정 및 클릭 이벤트
    if (detailBg) {
        detailBg.src = backgroundSrc(id);
        detailBg.onerror = () => { detailBg.src = "images/default_background.jpg"; };

        let backgroundHistory = [];
        try {
            const res = await fetch(historyDataSrc(id, 'background'));
            if(res.ok) {
                const csvText = await res.text();
                const rawHistory = parseCsv(csvText);
                const sortedHistory = rawHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
                backgroundHistory = sortedHistory.map(item => ({ ...item, type_orig: 'background', type: getMediaType(item.path) }));
                if (backgroundHistory.length > 0) {
                    detailBg.src = backgroundHistory[0].path;
                }
            } else if (res.status === 404) {
                 console.warn(`No background history CSV found for ${id}. Using current image only.`);
            } else {
                console.error(`Failed to load background history for view page. Status: ${res.status}`);
            }
        } catch (error) {
            console.error("Error loading background history for view page:", error);
        }

        // 배경 이미지 클릭 시 view.html 전용 미디어 팝업 열기
        detailBg.addEventListener("click", () => {
            if (backgroundHistory.length > 0) {
                openMediaModalView(backgroundHistory[0].path, backgroundHistory[0].type, backgroundHistory, 0);
            } else {
                openMediaModalView(detailBg.src, getMediaType(detailBg.src), [{ path: detailBg.src, type: getMediaType(detailBg.src), type_orig: 'background' }], 0);
            }
        });
    }

    // 프로필 이미지 설정 및 클릭 이벤트
    if (detailProf) {
        detailProf.src = profileSrc(id);
        detailProf.onerror = () => { detailProf.src = "images/default_profile.jpg"; };

        let profileHistory = [];
        try {
            const res = await fetch(historyDataSrc(id, 'profile'));
            if(res.ok) {
                const csvText = await res.text();
                const rawHistory = parseCsv(csvText);
                const sortedHistory = rawHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
                profileHistory = sortedHistory.map(item => ({ ...item, type_orig: 'profile', type: getMediaType(item.path) }));
                if (profileHistory.length > 0) {
                    detailProf.src = profileHistory[0].path;
                }
            } else if (res.status === 404) {
                console.warn(`No profile history CSV found for ${id}. Using current image only.`);
            } else {
                console.error(`Failed to load profile history for view page. Status: ${res.status}`);
            }
        } catch (error) {
            console.error("Error loading profile history for view page:", error);
        }

        // 프로필 이미지 클릭 시 view.html 전용 미디어 팝업 열기
        detailProf.addEventListener("click", () => {
            if (profileHistory.length > 0) {
                openMediaModalView(profileHistory[0].path, profileHistory[0].type, profileHistory, 0);
            } else {
                openMediaModalView(detailProf.src, getMediaType(detailProf.src), [{ path: detailProf.src, type: getMediaType(detailProf.src), type_orig: 'profile' }], 0);
            }
        });
    }

    if (detailNameEl) {
        detailNameEl.textContent = disp;
    }
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


// --- 미디어 모달 관련 DOM 요소 참조 변수 (member.html, chat.html에서 사용) ---
const mediaModal = qs("#mediaModal"); // member.html에 있는 기존 모달
const closeMediaModalBtn = qs("#closeMediaModal");
const modalImage = qs("#modalImage");
const modalVideo = qs("#modalVideo");
const downloadMediaBtn = qs("#downloadMediaBtn");
const prevMediaBtn = qs("#prevMediaBtn");
const nextMediaBtn = qs("#nextMediaBtn");

// --- ⭐ 새로운 미디어 모달 관련 DOM 요소 참조 변수 (view.html에서 사용) ⭐ ---
const mediaModalView = qs("#mediaModalView");
const closeMediaBtnView = qs("#closeMediaBtnView");
const modalImageView = qs("#modalImageView");
const modalVideoView = qs("#modalVideoView");
const downloadMediaBtnView = qs("#downloadMediaBtnView");
const prevMediaBtnView = qs("#prevMediaBtnView");
const nextMediaBtnView = qs("#nextMediaBtnView");

let currentMediaHistory = []; // 공통 히스토리 저장 변수
let currentMediaIndex = 0; // 공통 인덱스 저장 변수

// 파일 경로를 기반으로 미디어 타입(이미지/비디오)을 결정하는 함수
function getMediaType(path) {
    if (/\.(mp4|mov|webm|ogg)$/i.test(path)) {
        return 'video';
    } else if (/\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(path)) {
        return 'image';
    }
    return 'unknown';
}

// 미디어 팝업을 여는 함수 (member.html, chat.html에서 사용)
function openMediaModal(mediaUrl, mediaType, historyData = [], initialIndex = 0) {
    if (!mediaModal || !modalImage || !modalVideo || !downloadMediaBtn) {
        console.error("미디어 모달 관련 DOM 요소를 찾을 수 없습니다. member.html에 mediaModal 구조가 있는지 확인해주세요.");
        return;
    }

    modalImage.style.display = 'none';
    modalVideo.style.display = 'none';
    modalVideo.pause();

    currentMediaHistory = historyData;
    currentMediaIndex = initialIndex;

    updateMediaModalContent(modalImage, modalVideo, downloadMediaBtn, prevMediaBtn, nextMediaBtn); // 재사용
    mediaModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    updateMediaNavButtons(prevMediaBtn, nextMediaBtn); // 재사용
}

// ⭐ 미디어 팝업을 여는 함수 (view.html에서 사용) ⭐
function openMediaModalView(mediaUrl, mediaType, historyData = [], initialIndex = 0) {
    if (!mediaModalView || !modalImageView || !modalVideoView || !downloadMediaBtnView) {
        console.error("View 미디어 모달 관련 DOM 요소를 찾을 수 없습니다. view.html에 mediaModalView 구조가 있는지 확인해주세요.");
        return;
    }

    modalImageView.style.display = 'none';
    modalVideoView.style.display = 'none';
    modalVideoView.pause();

    currentMediaHistory = historyData;
    currentMediaIndex = initialIndex;

    updateMediaModalContent(modalImageView, modalVideoView, downloadMediaBtnView, prevMediaBtnView, nextMediaBtnView); // 재사용
    mediaModalView.classList.add('active'); // CSS Transition을 위해 active 클래스 사용
    document.body.style.overflow = 'hidden';

    updateMediaNavButtons(prevMediaBtnView, nextMediaBtnView); // 재사용
}


// 미디어 팝업 콘텐츠를 업데이트하는 공통 함수
function updateMediaModalContent(imgEl, videoEl, downloadBtnEl, prevBtnEl, nextBtnEl) {
    const mediaItem = currentMediaHistory[currentMediaIndex];
    if (!mediaItem) {
        console.error("Invalid media history item or index:", currentMediaIndex, currentMediaHistory);
        return;
    }

    imgEl.style.display = 'none';
    videoEl.style.display = 'none';
    videoEl.pause();
    videoEl.currentTime = 0;

    if (mediaItem.type === 'image' || mediaItem.type_orig === 'image') {
        imgEl.src = mediaItem.path;
        imgEl.style.display = 'block';
    } else if (mediaItem.type === 'video' || mediaItem.type_orig === 'video') {
        videoEl.src = mediaItem.path;
        videoEl.style.display = 'block';
        videoEl.load();
    } else {
        console.warn("Unknown media type or missing path in history item:", mediaItem);
    }

    downloadBtnEl.href = mediaItem.path;
    const fileName = mediaItem.path.split('/').pop().split('?')[0];
    downloadBtnEl.download = fileName;
}

// 미디어 팝업 이전/다음 버튼 상태를 업데이트하는 공통 함수
function updateMediaNavButtons(prevBtnEl, nextBtnEl) {
    if (prevBtnEl) {
        prevBtnEl.disabled = currentMediaIndex === 0;
    }
    if (nextBtnEl) {
        nextBtnEl.disabled = currentMediaIndex === currentMediaHistory.length - 1;
    }
}

// 다음 미디어를 보여주는 함수 (공통)
function showNextMedia(prevBtnEl, nextBtnEl, imgEl, videoEl, downloadBtnEl) {
    if (currentMediaIndex < currentMediaHistory.length - 1) {
        currentMediaIndex++;
        updateMediaModalContent(imgEl, videoEl, downloadBtnEl, prevBtnEl, nextBtnEl);
        updateMediaNavButtons(prevBtnEl, nextBtnEl);
    }
}

// 이전 미디어를 보여주는 함수 (공통)
function showPrevMedia(prevBtnEl, nextBtnEl, imgEl, videoEl, downloadBtnEl) {
    if (currentMediaIndex > 0) {
        currentMediaIndex--;
        updateMediaModalContent(imgEl, videoEl, downloadBtnEl, prevBtnEl, nextBtnEl);
        updateMediaNavButtons(prevBtnEl, nextBtnEl);
    }
}

// 미디어 팝업을 닫는 함수 (member.html, chat.html에서 사용)
function closeMediaModal() {
    if (mediaModal) {
        mediaModal.classList.add('hidden');
        modalImage.src = '';
        modalVideo.src = '';
        modalVideo.pause();
        modalVideo.currentTime = 0;
        document.body.style.overflow = '';
        currentMediaHistory = [];
        currentMediaIndex = 0;
    }
}

// ⭐ 미디어 팝업을 닫는 함수 (view.html에서 사용) ⭐
function closeMediaModalView() {
    if (mediaModalView) {
        mediaModalView.classList.remove('active'); // CSS Transition을 위해 active 클래스 제거
        modalImageView.src = '';
        modalVideoView.src = '';
        modalVideoView.pause();
        modalVideoView.currentTime = 0;
        document.body.style.overflow = '';
        currentMediaHistory = [];
        currentMediaIndex = 0;
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

    // 채팅 메시지 내 이미지/동영상 클릭 이벤트 추가
    if (mediaUrl) {
        msgContent.style.cursor = 'pointer';
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
  }else if(path.endsWith("view.html")){
    initView(); // view.html 페이지 초기화
  }

  // --- 기존 미디어 팝업 버튼 이벤트 리스너 (member.html, chat.html용) ---
  if (closeMediaModalBtn) {
    closeMediaModalBtn.addEventListener('click', closeMediaModal);
  }
  if (mediaModal) {
    mediaModal.addEventListener('click', (e) => {
        if (e.target === mediaModal) {
            closeMediaModal();
        }
    });
  }

  // --- ⭐ 새로운 미디어 팝업 버튼 이벤트 리스너 (view.html용) ⭐ ---
  if (closeMediaBtnView) {
    closeMediaBtnView.addEventListener('click', closeMediaModalView);
  }
  if (mediaModalView) {
    mediaModalView.addEventListener('click', (e) => {
        if (e.target === mediaModalView) {
            closeMediaModalView();
        }
    });
  }
  if (prevMediaBtnView) {
    // view.html의 showPrevMedia는 모든 관련 DOM 요소를 인자로 받습니다.
    prevMediaBtnView.addEventListener('click', () => showPrevMedia(prevMediaBtnView, nextMediaBtnView, modalImageView, modalVideoView, downloadMediaBtnView));
  }
  if (nextMediaBtnView) {
    // view.html의 showNextMedia는 모든 관련 DOM 요소를 인자로 받습니다.
    nextMediaBtnView.addEventListener('click', () => showNextMedia(prevMediaBtnView, nextMediaBtnView, modalImageView, modalVideoView, downloadMediaBtnView));
  }
});

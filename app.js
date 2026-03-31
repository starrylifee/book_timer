const RECORDS_KEY = "sindap-book-mission-records-v3";
const SETTINGS_KEY = "sindap-book-mission-settings-v3";
const LEGACY_RECORDS_KEYS = ["sindap-book-mission-records-v2"];
const LEGACY_SETTINGS_KEYS = ["sindap-book-mission-settings-v2"];
const DEFAULT_BASE_MINUTES = 5;
const DEFAULT_PENALTY_MINUTES = 1;
const GROWND_POINTS_API_TEMPLATE = "https://growndcard.com/api/v1/classes/{classId}/students/{studentCode}/points";
const DEFAULT_REWARD_SOURCE = "morning-reading-board";
const DEFAULT_STUDENT_ROSTER = [
  { id: "1", number: "1", name: "", nickname: "" },
  { id: "2", number: "2", name: "", nickname: "" },
  { id: "3", number: "3", name: "", nickname: "" },
  { id: "4", number: "4", name: "", nickname: "" },
  { id: "6", number: "6", name: "", nickname: "" },
  { id: "8", number: "8", name: "", nickname: "" },
  { id: "9", number: "9", name: "", nickname: "" },
  { id: "10", number: "10", name: "", nickname: "" },
  { id: "11", number: "11", name: "", nickname: "" },
  { id: "12", number: "12", name: "", nickname: "" },
  { id: "13", number: "13", name: "", nickname: "" },
  { id: "14", number: "14", name: "", nickname: "" },
  { id: "15", number: "15", name: "", nickname: "" },
  { id: "16", number: "16", name: "", nickname: "" },
  { id: "17", number: "17", name: "", nickname: "" },
  { id: "18", number: "18", name: "", nickname: "" },
  { id: "19", number: "19", name: "", nickname: "" },
  { id: "20", number: "20", name: "", nickname: "" },
  { id: "21", number: "21", name: "", nickname: "" },
];
const WEEKDAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const WEEKDAY_LABELS = {
  sunday: "일요일",
  monday: "월요일",
  tuesday: "화요일",
  wednesday: "수요일",
  thursday: "목요일",
  friday: "금요일",
  saturday: "토요일",
};
const DEFAULT_SETTINGS = {
  general: {
    schoolName: "우리 학교",
    className: "우리 반",
    baseMinutes: DEFAULT_BASE_MINUTES,
    penaltyMinutes: DEFAULT_PENALTY_MINUTES,
  },
  students: {
    roster: DEFAULT_STUDENT_ROSTER,
    displayMode: "name-or-nickname",
  },
  importantNotice: "중요사항을 설정에서 입력해 주세요.",
  dailyAlerts: {},
  schedules: {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
  },
  rewards: {
    enabled: false,
    apiUrl: GROWND_POINTS_API_TEMPLATE,
    apiKeyHeader: "X-API-Key",
    apiKey: "",
    classId: "",
    points: 10,
    reason: "아침 독서 미션 성공",
  },
  security: {
    adminPassword: "",
  },
};

const elements = {
  summaryTitle: document.getElementById("summaryTitle"),
  summaryCopy: document.getElementById("summaryCopy"),
  boardTitle: document.getElementById("boardTitle"),
  boardNote: document.getElementById("boardNote"),
  board: document.getElementById("board"),
  todayLabel: document.getElementById("todayLabel"),
  successCount: document.getElementById("successCount"),
  readingCount: document.getElementById("readingCount"),
  idleCount: document.getElementById("idleCount"),
  readingStudentsLabel: document.getElementById("readingStudentsLabel"),
  readingStudentsHelp: document.getElementById("readingStudentsHelp"),
  readingStudentsList: document.getElementById("readingStudentsList"),
  approvalSummary: document.getElementById("approvalSummary"),
  approvalStatusText: document.getElementById("approvalStatusText"),
  pendingApprovalCount: document.getElementById("pendingApprovalCount"),
  approvedCount: document.getElementById("approvedCount"),
  weekdayLabel: document.getElementById("weekdayLabel"),
  todayAlertText: document.getElementById("todayAlertText"),
  importantNoticeText: document.getElementById("importantNoticeText"),
  scheduleList: document.getElementById("scheduleList"),
  notice: document.getElementById("notice"),
  openSettingsBtn: document.getElementById("openSettingsBtn"),
  closeSettingsBtn: document.getElementById("closeSettingsBtn"),
  cancelSettingsBtn: document.getElementById("cancelSettingsBtn"),
  approveAllBtn: document.getElementById("approveAllBtn"),
  downloadTodayBtn: document.getElementById("downloadTodayBtn"),
  downloadAllBtn: document.getElementById("downloadAllBtn"),
  resetApprovalsBtn: document.getElementById("resetApprovalsBtn"),
  resetTodayBtn: document.getElementById("resetTodayBtn"),
  settingsOverlay: document.getElementById("settingsOverlay"),
  settingsForm: document.getElementById("settingsForm"),
  adminPromptOverlay: document.getElementById("adminPromptOverlay"),
  adminPromptForm: document.getElementById("adminPromptForm"),
  adminPromptMessage: document.getElementById("adminPromptMessage"),
  adminPasswordInput: document.getElementById("adminPasswordInput"),
  closeAdminPromptBtn: document.getElementById("closeAdminPromptBtn"),
  cancelAdminPromptBtn: document.getElementById("cancelAdminPromptBtn"),
};

const appState = loadJsonWithLegacy(RECORDS_KEY, LEGACY_RECORDS_KEYS, { records: {} });
let settingsState = loadSettings();
let activeDateKey = getTodayKey();
let noticeTimerId = null;
let pendingCancelStudentId = "";

initialize();

function initialize() {
  ensureDateRecord(activeDateKey);
  bindEvents();
  populateSettingsForm();
  renderAll();
}

function bindEvents() {
  elements.board.addEventListener("click", handleBoardTouch);
  elements.readingStudentsList.addEventListener("click", handleReadingListAction);
  elements.approveAllBtn.addEventListener("click", () => {
    void approveCompletedStudents();
  });
  elements.downloadTodayBtn.addEventListener("click", () => downloadCsv("today"));
  elements.downloadAllBtn.addEventListener("click", () => downloadCsv("all"));
  elements.resetApprovalsBtn.addEventListener("click", resetApprovalsToday);
  elements.resetTodayBtn.addEventListener("click", resetToday);
  elements.openSettingsBtn.addEventListener("click", openSettings);
  elements.closeSettingsBtn.addEventListener("click", closeSettings);
  elements.cancelSettingsBtn.addEventListener("click", closeSettings);
  elements.settingsForm.addEventListener("submit", handleSettingsSubmit);
  elements.adminPromptForm.addEventListener("submit", handleAdminPromptSubmit);
  elements.closeAdminPromptBtn.addEventListener("click", closeAdminPrompt);
  elements.cancelAdminPromptBtn.addEventListener("click", closeAdminPrompt);
  elements.settingsOverlay.addEventListener("click", (event) => {
    if (event.target === elements.settingsOverlay) {
      closeSettings();
    }
  });
  elements.adminPromptOverlay.addEventListener("click", (event) => {
    if (event.target === elements.adminPromptOverlay) {
      closeAdminPrompt();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      syncDateIfNeeded();
    }
  });
  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (!elements.adminPromptOverlay.hidden) {
      closeAdminPrompt();
      return;
    }

    if (!elements.settingsOverlay.hidden) {
      closeSettings();
    }
  });
  window.setInterval(syncDateIfNeeded, 30_000);
}

function renderAll() {
  renderGeneral();
  renderSummary();
  renderReadingStudents();
  renderApproval();
  renderAlerts();
  renderSchedule();
  renderBoard();
}

function renderGeneral() {
  const title = buildDisplayTitle();
  const baseMinutes = getBaseMinutes();
  const penaltyMinutes = getPenaltyMinutes();
  const summaryText = title
    ? `${title} · 번호를 누르고 읽은 뒤 다시 눌러요.`
    : "번호를 누르고 읽은 뒤 다시 눌러요.";

  document.title = `${title} 아침 독서 미션`;
  elements.summaryTitle.textContent = "아침 독서 시작";
  elements.summaryCopy.textContent = summaryText;
  elements.summaryCopy.title = title
    ? `${title} · 준비가 되면 자기 번호를 한 번 누르고, 차분히 읽은 뒤 같은 번호를 다시 눌러요.`
    : summaryText;
  elements.boardTitle.textContent = "준비되면 자기 번호를 눌러요";
  elements.boardNote.textContent =
    `${baseMinutes}분 뒤 성공 · 일찍 누르면 ${penaltyMinutes}분 추가`;
}

function renderSummary() {
  const todayRecord = getTodayRecord();
  const studentIds = getStudentIds();
  const successCount = countByStatus(todayRecord, "success");
  const readingCount = countByStatus(todayRecord, "reading");
  const idleCount = studentIds.length - successCount - readingCount;

  elements.todayLabel.textContent = formatDateLabel(activeDateKey);
  elements.successCount.textContent = `${successCount} / ${studentIds.length}`;
  elements.readingCount.textContent = `${readingCount}명`;
  elements.idleCount.textContent = `${idleCount}명`;
}

function renderApproval() {
  const todayRecord = getTodayRecord();
  const pendingCount = countPendingApprovals(todayRecord);
  const approvedCount = countApprovedStudents(todayRecord);
  const rewardsEnabled = settingsState.rewards.enabled;

  elements.pendingApprovalCount.textContent = `${pendingCount}명`;
  elements.approvedCount.textContent = `${approvedCount}명`;
  elements.approvalSummary.textContent = pendingCount > 0
    ? `${rewardsEnabled ? "승인/전송 대기" : "로컬 승인 대기"} ${pendingCount}명`
    : "모든 성공 학생 승인 완료";
  elements.approvalStatusText.textContent = rewardsEnabled
    ? "체크 ON 상태입니다. 버튼을 누르면 GROWND 전송 후 승인됩니다."
    : "체크 OFF 상태입니다. 지금 누르면 로컬 승인만 되고 GROWND 전송은 되지 않습니다.";
  elements.approveAllBtn.textContent = rewardsEnabled ? "성공 학생 승인 + 전송" : "성공 학생 로컬 승인";
  elements.approveAllBtn.disabled = pendingCount === 0;
}

function renderAlerts() {
  const todayAlert = settingsState.dailyAlerts[activeDateKey]?.trim();
  elements.todayAlertText.textContent = todayAlert || "오늘 알림이 없습니다.";
  elements.importantNoticeText.textContent = settingsState.importantNotice || "중요한 공지가 없습니다.";
}

function renderSchedule() {
  const weekdayKey = getWeekdayKey(new Date());
  const weekdayLabel = WEEKDAY_LABELS[weekdayKey];
  const scheduleItems = settingsState.schedules[weekdayKey] || [];

  elements.weekdayLabel.textContent = weekdayLabel;
  elements.scheduleList.classList.toggle("is-long", scheduleItems.length >= 5);
  elements.scheduleList.classList.toggle("is-very-long", scheduleItems.length >= 7);

  if (scheduleItems.length === 0) {
    const message = weekdayKey === "saturday" || weekdayKey === "sunday"
      ? "오늘은 수업이 없습니다."
      : "오늘 시간표가 아직 준비되지 않았습니다.";
    elements.scheduleList.innerHTML = `<li class="schedule-empty">${message}</li>`;
    return;
  }

  elements.scheduleList.innerHTML = scheduleItems
    .map((item, index) => {
      const scheduleEntry = formatScheduleItem(item, index);
      const itemLabel = `${scheduleEntry.period}교시 ${scheduleEntry.subject}`.trim();

      return `
        <li class="schedule-item" aria-label="${escapeHtml(itemLabel)}">
          <span class="schedule-period">${escapeHtml(scheduleEntry.period)}</span>
          <span class="schedule-subject">${escapeHtml(scheduleEntry.subject)}</span>
        </li>
      `;
    })
    .join("");
}

function renderReadingStudents() {
  const todayRecord = getTodayRecord();
  const readingStudents = getStudentRoster()
    .map((student) => ({ student, entry: todayRecord[student.id] }))
    .filter(({ entry }) => entry?.status === "reading");
  const canCancelReading = hasAdminPassword();

  elements.readingStudentsLabel.textContent = `${readingStudents.length}명`;
  elements.readingStudentsHelp.textContent = canCancelReading
    ? "잘못 누른 번호만 작은 취소 버튼으로 되돌릴 수 있습니다."
    : "교사 설정에 관리자 비밀번호를 저장하면 번호 취소를 사용할 수 있습니다.";

  if (readingStudents.length === 0) {
    elements.readingStudentsList.innerHTML = `
      <li class="reading-empty">지금은 읽는 중인 학생이 없습니다.</li>
    `;
    return;
  }

  elements.readingStudentsList.innerHTML = readingStudents
    .map(({ student, entry }) => {
      const displayName = getStudentDisplayName(student);
      const studentLabel = `${student.number}번${displayName ? ` ${displayName}` : ""}`;
      const startedLabel = entry.startedAt ? `시작 ${formatTime(entry.startedAt)}` : "방금 시작";
      const cancelButtonAttrs = canCancelReading
        ? ""
        : ' disabled aria-disabled="true" title="관리자 비밀번호를 먼저 저장하세요."';

      return `
        <li class="reading-item">
          <div class="reading-student">
            <strong>${escapeHtml(studentLabel)}</strong>
            <span>${escapeHtml(startedLabel)}</span>
          </div>
          <button
            type="button"
            class="inline-button reading-cancel-button"
            data-reading-cancel="${escapeHtml(student.id)}"${cancelButtonAttrs}
          >
            취소
          </button>
        </li>
      `;
    })
    .join("");
}

function renderBoard() {
  const todayRecord = getTodayRecord();
  const roster = getStudentRoster();
  const columns = getBoardColumnCount(roster.length);
  const rows = Math.max(1, Math.ceil(roster.length / columns));

  elements.board.style.setProperty("--student-columns", String(columns));
  elements.board.style.setProperty("--student-rows", String(rows));
  elements.board.classList.toggle("is-dense", roster.length > 24);
  elements.board.classList.toggle("is-very-dense", roster.length > 35);
  elements.board.innerHTML = roster.map((student) => renderCard(student, todayRecord[student.id])).join("");
}

function renderCard(student, entry) {
  const badgeText = getBadgeText(entry.status);
  const titleText = getTitleText(entry);
  const displayName = getStudentDisplayName(student);
  const safeNumber = escapeHtml(student.number);
  const approvalChip = entry.approvedAt ? `<span class="approval-chip">승인</span>` : "";

  return `
    <button type="button" class="student-card is-${entry.status}" data-student-id="${escapeHtml(student.id)}" aria-label="${safeNumber}번 ${titleText}">
      <div class="student-card-top">
        <div>
          <span class="student-number">${safeNumber}</span>
          ${displayName ? `<span class="student-display-name">${escapeHtml(displayName)}</span>` : ""}
        </div>
        <span class="state-badge">${badgeText}</span>
      </div>
      <div class="student-card-bottom">
        <strong class="state-title">${titleText}</strong>
        ${approvalChip}
      </div>
    </button>
  `;
}

function handleBoardTouch(event) {
  const button = event.target.closest("[data-student-id]");

  if (!button) {
    return;
  }

  syncDateIfNeeded();

  const studentId = button.dataset.studentId;
  const student = getStudentById(studentId);

  if (!student) {
    return;
  }

  const studentNumber = student.number;
  const entry = getTodayRecord()[studentId];
  const now = new Date();

  if (entry.status === "idle") {
    entry.status = "reading";
    entry.startedAt = now.toISOString();
    entry.completedAt = "";
    entry.baseMinutesUsed = getBaseMinutes();
    entry.penaltyMinutesUsed = getPenaltyMinutes();
    entry.requiredMinutes = entry.baseMinutesUsed;
    entry.earlyTouches = 0;
    entry.history = [{ type: "start", at: entry.startedAt }];
    persistRecords();
    renderAll();
    showNotice(`${studentNumber}번 독서 시작`, "default");
    return;
  }

  if (entry.status === "success") {
    showNotice(`${studentNumber}번은 이미 성공했어요.`, "success");
    return;
  }

  const elapsedMs = now.getTime() - new Date(entry.startedAt).getTime();
  const requiredMs = entry.requiredMinutes * 60 * 1000;
  const elapsedLabel = formatElapsedDuration(elapsedMs);

  if (elapsedMs >= requiredMs) {
    entry.status = "success";
    entry.completedAt = now.toISOString();
    entry.history.push({ type: "success", at: entry.completedAt });
    persistRecords();
    renderAll();
    showNotice(`${studentNumber}번 미션 성공 · 경과 시간 ${elapsedLabel}`, "success");
    return;
  }

  entry.earlyTouches += 1;
  entry.requiredMinutes += entry.penaltyMinutesUsed;
  entry.history.push({
    type: "early_touch",
    at: now.toISOString(),
    requiredMinutes: entry.requiredMinutes,
  });
  persistRecords();
  renderAll();
  showNotice(
    `${studentNumber}번, 현재 ${elapsedLabel} 읽었습니다. 돌아가서 더 읽으세요. ${entry.penaltyMinutesUsed}분 추가되었습니다.`,
    "warning",
    { duration: 3200, speak: true }
  );
}

function handleReadingListAction(event) {
  const button = event.target.closest("[data-reading-cancel]");

  if (!button) {
    return;
  }

  requestReadingCancel(button.dataset.readingCancel);
}

function requestReadingCancel(studentId) {
  syncDateIfNeeded();

  const targetId = String(studentId || "").trim();
  const student = getStudentById(targetId);
  const entry = getTodayRecord()[targetId];

  if (!student || entry?.status !== "reading") {
    renderAll();
    showNotice("이미 읽는 중 상태가 아니라서 취소할 수 없습니다.", "default");
    return;
  }

  if (!hasAdminPassword()) {
    showNotice("교사 설정에서 관리자 비밀번호를 먼저 저장해 주세요.", "warning", { duration: 2600 });
    return;
  }

  const displayName = getStudentDisplayName(student);
  const studentLabel = `${student.number}번${displayName ? ` ${displayName}` : ""}`;

  pendingCancelStudentId = targetId;
  elements.adminPromptMessage.textContent = `${studentLabel} 학생의 읽는 중 상태를 취소하려면 관리자 비밀번호를 입력하세요.`;
  elements.adminPromptForm.reset();
  elements.adminPromptOverlay.hidden = false;
  window.setTimeout(() => {
    elements.adminPasswordInput.focus();
  }, 0);
}

function handleAdminPromptSubmit(event) {
  event.preventDefault();

  const studentId = pendingCancelStudentId;
  const password = elements.adminPasswordInput.value;

  if (!studentId) {
    closeAdminPrompt();
    return;
  }

  if (password !== getAdminPassword()) {
    showNotice("관리자 비밀번호가 올바르지 않습니다.", "warning", { duration: 2200 });
    elements.adminPasswordInput.select();
    return;
  }

  closeAdminPrompt();
  cancelReadingForStudent(studentId);
}

function closeAdminPrompt() {
  pendingCancelStudentId = "";
  elements.adminPromptOverlay.hidden = true;
  elements.adminPromptForm.reset();
}

function cancelReadingForStudent(studentId) {
  const targetId = String(studentId || "").trim();
  const todayRecord = getTodayRecord();
  const student = getStudentById(targetId);
  const entry = todayRecord[targetId];

  if (!student || entry?.status !== "reading") {
    renderAll();
    showNotice("이미 읽는 중 상태가 아니라서 취소할 수 없습니다.", "default");
    return;
  }

  const canceledAt = new Date().toISOString();
  const nextHistory = Array.isArray(entry.history) ? [...entry.history] : [];
  nextHistory.push({
    type: "cancelled_by_admin",
    at: canceledAt,
  });

  todayRecord[targetId] = {
    ...createBlankEntry(),
    history: nextHistory,
  };

  persistRecords();
  renderAll();
  showNotice(`${student.number}번 읽는 중 상태를 취소했습니다.`, "default");
}

async function approveCompletedStudents() {
  syncDateIfNeeded();

  const todayRecord = getTodayRecord();
  const pendingStudents = getPendingApprovalStudents(todayRecord);

  if (pendingStudents.length === 0) {
    showNotice("승인할 학생이 없습니다.", "default");
    return;
  }

  elements.approveAllBtn.disabled = true;
  elements.approveAllBtn.textContent = "승인 처리 중...";

  const approvedAt = new Date().toISOString();
  const rewardsEnabled = settingsState.rewards.enabled;
  let approvedCount = 0;
  let failedCount = 0;

  for (const student of pendingStudents) {
    const entry = todayRecord[student.id];

    if (!rewardsEnabled) {
      markStudentApproved(entry, approvedAt, 0, "");
      approvedCount += 1;
      continue;
    }

    try {
      await sendReward(student, approvedAt);
      markStudentApproved(entry, approvedAt, getRewardPoints(), "");
      approvedCount += 1;
    } catch (error) {
      entry.rewardSyncError = error instanceof Error ? error.message : "포인트 전송 실패";
      entry.history.push({
        type: "reward_error",
        at: approvedAt,
        message: entry.rewardSyncError,
      });
      failedCount += 1;
    }
  }

  persistRecords();
  renderAll();

  if (failedCount > 0) {
    showNotice(`승인 ${approvedCount}명, 전송 실패 ${failedCount}명입니다.`, "warning", { duration: 2600 });
    return;
  }

  showNotice(
    rewardsEnabled
      ? `학생 ${approvedCount}명 승인 및 전송 완료`
      : `학생 ${approvedCount}명 로컬 승인 완료`,
    "success"
  );
}

function markStudentApproved(entry, approvedAt, rewardPoints, errorMessage) {
  entry.approvedAt = approvedAt;
  entry.rewardPointsSent = rewardPoints;
  entry.rewardSyncedAt = rewardPoints > 0 ? approvedAt : "";
  entry.rewardSyncError = errorMessage;
  entry.history.push({
    type: "approved",
    at: approvedAt,
    rewardPoints,
  });
}

async function sendReward(student, approvedAt) {
  const config = settingsState.rewards;

  if (!config.apiUrl || !config.classId) {
    throw new Error("승인 API URL 또는 반 ID가 비어 있습니다.");
  }

  if (!config.apiKey) {
    throw new Error("API 키가 비어 있습니다.");
  }

  const headers = {
    "Content-Type": "application/json",
    [config.apiKeyHeader || "X-API-Key"]: config.apiKey,
  };

  const payload = {
    type: "reward",
    points: getRewardPoints(),
    description: config.reason || DEFAULT_SETTINGS.rewards.reason,
    source: DEFAULT_REWARD_SOURCE,
    metadata: {
      date: activeDateKey,
      approvedAt,
      studentCode: toStudentCode(student.number),
      studentNumber: student.number,
      studentName: student.name || "",
      studentNickname: student.nickname || "",
    },
  };

  const response = await fetch(buildRewardApiUrl(config, student), {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;

    try {
      const data = await response.json();
      message = data?.error?.message || data?.message || message;
    } catch (error) {
      try {
        message = await response.text() || message;
      } catch (innerError) {
        void innerError;
      }
    }

    throw new Error(message);
  }
}

function buildRewardApiUrl(config, student) {
  const rawUrl = String(config.apiUrl || "").trim();
  const classId = String(config.classId || "").trim();
  const encodedClassId = encodeURIComponent(classId);
  const encodedStudentCode = encodeURIComponent(String(toStudentCode(student.number)));

  if (!rawUrl || !classId) {
    return rawUrl;
  }

  if (rawUrl.includes("{classId}") || rawUrl.includes("{studentCode}")) {
    return rawUrl
      .replaceAll("{classId}", encodedClassId)
      .replaceAll("{studentCode}", encodedStudentCode);
  }

  if (/\/api\/v1\/classes\/[^/]+\/students\/[^/]+\/points\/?$/i.test(rawUrl)) {
    return rawUrl;
  }

  return `${rawUrl.replace(/\/+$/, "")}/api/v1/classes/${encodedClassId}/students/${encodedStudentCode}/points`;
}

function getBadgeText(status) {
  if (status === "reading") {
    return "진행";
  }

  if (status === "success") {
    return "성공";
  }

  return "대기";
}

function getTitleText(entry) {
  if (entry.status === "reading") {
    return "읽는 중";
  }

  if (entry.status === "success") {
    return "성공";
  }

  return "터치 시작";
}

function getCopyText(entry) {
  if (entry.status === "reading") {
    const extraMinutes = Math.max(0, entry.requiredMinutes - entry.baseMinutesUsed);

    if (extraMinutes > 0) {
      return `추가 미션 +${extraMinutes}분`;
    }

    return "조용히 읽고 다시 오세요.";
  }

  if (entry.status === "success") {
    return entry.approvedAt ? "오늘 아침 독서 승인 완료" : "오늘 아침 독서 완료";
  }

  return "첫 터치는 시작입니다.";
}

function openSettings() {
  populateSettingsForm();
  renderReadingStudents();
  elements.settingsOverlay.hidden = false;
}

function closeSettings() {
  closeAdminPrompt();
  elements.settingsOverlay.hidden = true;
}

function populateSettingsForm() {
  const form = elements.settingsForm;
  setFieldValue(form, "schoolName", settingsState.general.schoolName);
  setFieldValue(form, "className", settingsState.general.className);
  setFieldValue(form, "baseMinutes", settingsState.general.baseMinutes);
  setFieldValue(form, "penaltyMinutes", settingsState.general.penaltyMinutes);
  setFieldValue(form, "adminPassword", getAdminPassword());
  setFieldValue(form, "studentRoster", rosterToTextareaValue(settingsState.students.roster));
  setFieldValue(form, "studentDisplayMode", settingsState.students.displayMode);
  setFieldValue(form, "todayAlert", settingsState.dailyAlerts[activeDateKey] || "");
  setFieldValue(form, "importantNotice", settingsState.importantNotice || "");
  setFieldValue(form, "schedule-monday", toTextareaValue(settingsState.schedules.monday));
  setFieldValue(form, "schedule-tuesday", toTextareaValue(settingsState.schedules.tuesday));
  setFieldValue(form, "schedule-wednesday", toTextareaValue(settingsState.schedules.wednesday));
  setFieldValue(form, "schedule-thursday", toTextareaValue(settingsState.schedules.thursday));
  setFieldValue(form, "schedule-friday", toTextareaValue(settingsState.schedules.friday));
  setFieldChecked(form, "rewardEnabled", settingsState.rewards.enabled);
  setFieldValue(form, "rewardApiUrl", settingsState.rewards.apiUrl);
  setFieldValue(form, "rewardApiKeyHeader", settingsState.rewards.apiKeyHeader);
  setFieldValue(form, "rewardApiKey", settingsState.rewards.apiKey);
  setFieldValue(form, "rewardClassId", settingsState.rewards.classId);
  setFieldValue(form, "rewardPoints", settingsState.rewards.points);
  setFieldValue(form, "rewardReason", settingsState.rewards.reason);
}

function handleSettingsSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const nextDailyAlerts = { ...settingsState.dailyAlerts };
  const todayAlert = getFieldValue(form, "todayAlert").trim();

  if (todayAlert) {
    nextDailyAlerts[activeDateKey] = todayAlert;
  } else {
    delete nextDailyAlerts[activeDateKey];
  }

  settingsState = {
    general: {
      schoolName: getFieldValue(form, "schoolName").trim() || DEFAULT_SETTINGS.general.schoolName,
      className: getFieldValue(form, "className").trim() || DEFAULT_SETTINGS.general.className,
      baseMinutes: clampPositiveInt(getFieldValue(form, "baseMinutes"), DEFAULT_BASE_MINUTES, 1, 120),
      penaltyMinutes: clampPositiveInt(getFieldValue(form, "penaltyMinutes"), DEFAULT_PENALTY_MINUTES, 1, 20),
    },
    security: {
      adminPassword: getFieldValue(form, "adminPassword"),
    },
    students: {
      roster: parseStudentRosterText(getFieldValue(form, "studentRoster")),
      displayMode: normalizeStudentDisplayMode(getFieldValue(form, "studentDisplayMode")),
    },
    importantNotice: getFieldValue(form, "importantNotice").trim(),
    dailyAlerts: nextDailyAlerts,
    schedules: {
      monday: parseLines(getFieldValue(form, "schedule-monday")),
      tuesday: parseLines(getFieldValue(form, "schedule-tuesday")),
      wednesday: parseLines(getFieldValue(form, "schedule-wednesday")),
      thursday: parseLines(getFieldValue(form, "schedule-thursday")),
      friday: parseLines(getFieldValue(form, "schedule-friday")),
    },
    rewards: {
      enabled: getFieldChecked(form, "rewardEnabled"),
      apiUrl: getFieldValue(form, "rewardApiUrl").trim() || DEFAULT_SETTINGS.rewards.apiUrl,
      apiKeyHeader: getFieldValue(form, "rewardApiKeyHeader").trim() || DEFAULT_SETTINGS.rewards.apiKeyHeader,
      apiKey: getFieldValue(form, "rewardApiKey").trim(),
      classId: getFieldValue(form, "rewardClassId").trim(),
      points: clampPositiveInt(getFieldValue(form, "rewardPoints"), DEFAULT_SETTINGS.rewards.points, 1, 1000),
      reason: getFieldValue(form, "rewardReason").trim() || DEFAULT_SETTINGS.rewards.reason,
    },
  };

  persistSettings();
  closeSettings();
  renderAll();
  showNotice("설정을 저장했습니다.", "default");
}

function resetToday() {
  syncDateIfNeeded();

  if (!window.confirm("오늘 독서 기록과 승인 기록을 모두 지울까요?")) {
    return;
  }

  appState.records[activeDateKey] = createBlankDayRecord();
  persistRecords();
  renderAll();
  showNotice("오늘 기록을 처음 상태로 되돌렸습니다.", "default");
}

function resetApprovalsToday() {
  syncDateIfNeeded();

  if (!window.confirm("오늘 성공 상태는 그대로 두고 승인 기록만 지울까요?")) {
    return;
  }

  const todayRecord = getTodayRecord();
  let clearedCount = 0;
  const resetAt = new Date().toISOString();

  getStudentIds().forEach((studentId) => {
    const entry = todayRecord[studentId];

    if (!entry?.approvedAt && !entry?.rewardSyncedAt && !entry?.rewardSyncError && !entry?.rewardPointsSent) {
      return;
    }

    entry.approvedAt = "";
    entry.rewardPointsSent = 0;
    entry.rewardSyncedAt = "";
    entry.rewardSyncError = "";
    entry.history.push({
      type: "approval_reset",
      at: resetAt,
    });
    clearedCount += 1;
  });

  if (clearedCount === 0) {
    showNotice("초기화할 승인 기록이 없습니다.", "default");
    return;
  }

  persistRecords();
  renderAll();
  showNotice(`승인 기록 ${clearedCount}건을 초기화했습니다.`, "default");
}

function downloadCsv(scope) {
  syncDateIfNeeded();

  const rows = buildCsvRows(scope);
  const header = [
    "날짜",
    "학교",
    "학급",
    "번호",
    "이름",
    "별명",
    "상태",
    "승인여부",
    "승인시각",
    "전송점수",
    "전송오류",
    "시작시각",
    "성공시각",
    "기본목표분",
    "추가분",
    "최종목표분",
    "조기터치횟수",
    "기록",
  ];
  const csvLines = [header, ...rows].map((row) => row.map(csvEscape).join(","));
  const csvText = `\uFEFF${csvLines.join("\r\n")}`;
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const label = scope === "today" ? activeDateKey : "전체";

  link.href = url;
  link.download = `아침독서미션_${label}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  showNotice(`${scope === "today" ? "오늘" : "전체"} CSV를 저장했습니다.`, "default");
}

function buildCsvRows(scope) {
  const dateKeys = scope === "today" ? [activeDateKey] : Object.keys(appState.records).sort();
  const rows = [];

  dateKeys.forEach((dateKey) => {
    const dayRecord = appState.records[dateKey];

    if (!dayRecord) {
      return;
    }

    getStudentRoster().forEach((student) => {
      const entry = normalizeEntry(dayRecord[student.id]);
      rows.push([
        dateKey,
        settingsState.general.schoolName,
        settingsState.general.className,
        student.number,
        student.name,
        student.nickname,
        getStatusLabel(entry.status),
        entry.approvedAt ? "승인" : "",
        formatDateTime(entry.approvedAt),
        String(entry.rewardPointsSent || 0),
        entry.rewardSyncError || "",
        formatDateTime(entry.startedAt),
        formatDateTime(entry.completedAt),
        String(entry.baseMinutesUsed),
        String(Math.max(0, entry.requiredMinutes - entry.baseMinutesUsed)),
        String(entry.requiredMinutes),
        String(entry.earlyTouches),
        formatHistory(entry.history),
      ]);
    });
  });

  return rows;
}

function showNotice(message, tone = "default", options = {}) {
  const { duration = 1800, speak = false } = options;

  window.clearTimeout(noticeTimerId);
  elements.notice.hidden = false;
  elements.notice.textContent = message;
  elements.notice.className = `notice${tone === "default" ? "" : ` is-${tone}`}`;

  if (speak && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = "ko-KR";
      utterance.rate = 0.96;
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("음성 안내를 재생하지 못했습니다.", error);
    }
  }

  noticeTimerId = window.setTimeout(() => {
    elements.notice.hidden = true;
  }, duration);
}

function syncDateIfNeeded() {
  const latestDateKey = getTodayKey();

  if (latestDateKey === activeDateKey) {
    return;
  }

  activeDateKey = latestDateKey;
  ensureDateRecord(activeDateKey);

  if (!elements.settingsOverlay.hidden) {
    populateSettingsForm();
  }

  renderAll();
  showNotice("새 날짜로 넘어가 오늘 기록판을 열었습니다.", "default");
}

function ensureDateRecord(dateKey) {
  if (!appState.records[dateKey]) {
    appState.records[dateKey] = createBlankDayRecord();
    persistRecords();
    return;
  }

  getStudentIds().forEach((studentId) => {
    appState.records[dateKey][studentId] = normalizeEntry(appState.records[dateKey][studentId]);
  });
}

function createBlankDayRecord() {
  const record = {};
  getStudentIds().forEach((studentId) => {
    record[studentId] = createBlankEntry();
  });
  return record;
}

function createBlankEntry() {
  return {
    status: "idle",
    startedAt: "",
    completedAt: "",
    approvedAt: "",
    rewardPointsSent: 0,
    rewardSyncedAt: "",
    rewardSyncError: "",
    baseMinutesUsed: getBaseMinutes(),
    penaltyMinutesUsed: getPenaltyMinutes(),
    requiredMinutes: getBaseMinutes(),
    earlyTouches: 0,
    history: [],
  };
}

function normalizeEntry(entry) {
  const baseMinutesUsed = clampPositiveInt(entry?.baseMinutesUsed, DEFAULT_BASE_MINUTES, 1, 120);
  const penaltyMinutesUsed = clampPositiveInt(entry?.penaltyMinutesUsed, DEFAULT_PENALTY_MINUTES, 1, 20);
  const requiredMinutes = clampPositiveInt(entry?.requiredMinutes, baseMinutesUsed, 1, 500);

  return {
    status: entry?.status === "reading" || entry?.status === "success" ? entry.status : "idle",
    startedAt: typeof entry?.startedAt === "string" ? entry.startedAt : "",
    completedAt: typeof entry?.completedAt === "string" ? entry.completedAt : "",
    approvedAt: typeof entry?.approvedAt === "string" ? entry.approvedAt : "",
    rewardPointsSent: Number(entry?.rewardPointsSent ?? 0) || 0,
    rewardSyncedAt: typeof entry?.rewardSyncedAt === "string" ? entry.rewardSyncedAt : "",
    rewardSyncError: typeof entry?.rewardSyncError === "string" ? entry.rewardSyncError : "",
    baseMinutesUsed,
    penaltyMinutesUsed,
    requiredMinutes,
    earlyTouches: Number(entry?.earlyTouches ?? 0) || 0,
    history: Array.isArray(entry?.history) ? entry.history : [],
  };
}

function getTodayRecord() {
  ensureDateRecord(activeDateKey);
  return appState.records[activeDateKey];
}

function countByStatus(record, status) {
  return getStudentIds().filter((studentId) => record[studentId]?.status === status).length;
}

function countPendingApprovals(record) {
  return getPendingApprovalStudents(record).length;
}

function countApprovedStudents(record) {
  return getStudentIds().filter((studentId) => Boolean(record[studentId]?.approvedAt)).length;
}

function getPendingApprovalStudents(record) {
  return getStudentRoster().filter((student) => {
    const entry = record[student.id];
    return entry?.status === "success" && !entry?.approvedAt;
  });
}

function loadSettings() {
  const loaded = loadJsonWithLegacy(SETTINGS_KEY, LEGACY_SETTINGS_KEYS, {});
  const legacySchoolName =
    typeof loaded.schoolName === "string"
      ? loaded.schoolName
      : DEFAULT_SETTINGS.general.schoolName;
  const legacyClassName =
    typeof loaded.className === "string"
      ? loaded.className
      : typeof loaded.classLabel === "string"
        ? loaded.classLabel
        : DEFAULT_SETTINGS.general.className;

  return {
    general: {
      schoolName:
        typeof loaded.general?.schoolName === "string" && loaded.general.schoolName.trim()
          ? loaded.general.schoolName
          : legacySchoolName,
      className:
        typeof loaded.general?.className === "string" && loaded.general.className.trim()
          ? loaded.general.className
          : legacyClassName,
      baseMinutes: clampPositiveInt(
        loaded.general?.baseMinutes,
        DEFAULT_SETTINGS.general.baseMinutes,
        1,
        120
      ),
      penaltyMinutes: clampPositiveInt(
        loaded.general?.penaltyMinutes,
        DEFAULT_SETTINGS.general.penaltyMinutes,
        1,
        20
      ),
    },
    students: {
      roster: normalizeStudentRoster(loaded.students?.roster),
      displayMode: normalizeStudentDisplayMode(loaded.students?.displayMode),
    },
    importantNotice: typeof loaded.importantNotice === "string" ? loaded.importantNotice : DEFAULT_SETTINGS.importantNotice,
    dailyAlerts: isPlainObject(loaded.dailyAlerts) ? loaded.dailyAlerts : {},
    schedules: {
      monday: normalizeStringArray(loaded.schedules?.monday),
      tuesday: normalizeStringArray(loaded.schedules?.tuesday),
      wednesday: normalizeStringArray(loaded.schedules?.wednesday),
      thursday: normalizeStringArray(loaded.schedules?.thursday),
      friday: normalizeStringArray(loaded.schedules?.friday),
    },
    rewards: {
      enabled: Boolean(loaded.rewards?.enabled),
      apiUrl:
        typeof loaded.rewards?.apiUrl === "string" && loaded.rewards.apiUrl.trim()
          ? loaded.rewards.apiUrl
          : DEFAULT_SETTINGS.rewards.apiUrl,
      apiKeyHeader:
        typeof loaded.rewards?.apiKeyHeader === "string" && loaded.rewards.apiKeyHeader.trim()
          ? loaded.rewards.apiKeyHeader
          : DEFAULT_SETTINGS.rewards.apiKeyHeader,
      apiKey: typeof loaded.rewards?.apiKey === "string" ? loaded.rewards.apiKey : DEFAULT_SETTINGS.rewards.apiKey,
      classId: typeof loaded.rewards?.classId === "string" ? loaded.rewards.classId : DEFAULT_SETTINGS.rewards.classId,
      points: clampPositiveInt(loaded.rewards?.points, DEFAULT_SETTINGS.rewards.points, 1, 1000),
      reason:
        typeof loaded.rewards?.reason === "string" && loaded.rewards.reason.trim()
          ? loaded.rewards.reason
          : DEFAULT_SETTINGS.rewards.reason,
    },
    security: {
      adminPassword:
        typeof loaded.security?.adminPassword === "string"
          ? loaded.security.adminPassword
          : typeof loaded.adminPassword === "string"
            ? loaded.adminPassword
            : DEFAULT_SETTINGS.security.adminPassword,
    },
  };
}

function persistRecords() {
  persistJson(RECORDS_KEY, appState);
}

function persistSettings() {
  persistJson(SETTINGS_KEY, settingsState);
}

function persistJson(storageKey, payload) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch (error) {
    console.error("브라우저 저장에 실패했습니다.", error);
    showNotice("브라우저 저장이 차단되어 기록을 보관하지 못하고 있습니다.", "warning", { duration: 2600 });
  }
}

function loadJson(storageKey, fallbackValue) {
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : fallbackValue;
  } catch (error) {
    console.error("저장된 데이터를 읽지 못했습니다.", error);
    return fallbackValue;
  }
}

function loadJsonWithLegacy(storageKey, legacyKeys, fallbackValue) {
  const keys = [storageKey, ...legacyKeys];

  for (const key of keys) {
    const value = loadJson(key, null);

    if (value !== null) {
      return value;
    }
  }

  return fallbackValue;
}

function buildDisplayTitle() {
  return [settingsState.general.schoolName.trim(), settingsState.general.className.trim()]
    .filter(Boolean)
    .join(" ");
}

function getBaseMinutes() {
  return clampPositiveInt(settingsState.general.baseMinutes, DEFAULT_BASE_MINUTES, 1, 120);
}

function getPenaltyMinutes() {
  return clampPositiveInt(settingsState.general.penaltyMinutes, DEFAULT_PENALTY_MINUTES, 1, 20);
}

function getRewardPoints() {
  return clampPositiveInt(settingsState.rewards?.points, DEFAULT_SETTINGS.rewards.points, 1, 1000);
}

function getAdminPassword() {
  return typeof settingsState.security?.adminPassword === "string" ? settingsState.security.adminPassword : "";
}

function hasAdminPassword() {
  return Boolean(getAdminPassword());
}

function getStudentRoster() {
  return normalizeStudentRoster(settingsState.students?.roster);
}

function getStudentIds() {
  return getStudentRoster().map((student) => student.id);
}

function getStudentById(studentId) {
  return getStudentRoster().find((student) => student.id === String(studentId)) || null;
}

function getStudentDisplayName(student) {
  const mode = normalizeStudentDisplayMode(settingsState.students?.displayMode);

  if (mode === "number") {
    return student.nickname || student.name || "";
  }

  if (mode === "name") {
    return student.name || student.nickname || "";
  }

  if (mode === "nickname") {
    return student.nickname || student.name || "";
  }

  if (mode === "name-or-nickname") {
    return student.name || student.nickname || "";
  }

  return "";
}

function getBoardColumnCount(studentCount) {
  if (studentCount <= 21) {
    return Math.min(7, Math.max(4, Math.ceil(studentCount / 3)));
  }

  if (studentCount <= 35) {
    return Math.min(8, Math.max(6, Math.ceil(studentCount / 4)));
  }

  if (studentCount <= 48) {
    return 8;
  }

  return 9;
}

function toStudentCode(value) {
  const text = String(value ?? "").trim();
  return /^\d+$/.test(text) ? Number(text) : text;
}

function getStatusLabel(status) {
  if (status === "reading") {
    return "진행 중";
  }

  if (status === "success") {
    return "성공";
  }

  return "미시작";
}

function formatHistory(history) {
  if (!Array.isArray(history) || history.length === 0) {
    return "";
  }

  return history
    .map((item) => {
      if (item.type === "start") {
        return `시작 ${formatTime(item.at)}`;
      }

      if (item.type === "success") {
        return `성공 ${formatTime(item.at)}`;
      }

      if (item.type === "approved") {
        return `승인 ${formatTime(item.at)} (${item.rewardPoints || 0}점)`;
      }

      if (item.type === "reward_error") {
        return `전송실패 ${formatTime(item.at)} (${item.message || "오류"})`;
      }

      if (item.type === "cancelled_by_admin") {
        return `관리자취소 ${formatTime(item.at)}`;
      }

      return `조기터치 ${formatTime(item.at)} (최종 ${item.requiredMinutes}분)`;
    })
    .join(" | ");
}

function getTodayKey() {
  return getDateKeyFromDate(new Date());
}

function getDateKeyFromDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekdayKey(date) {
  return WEEKDAY_KEYS[date.getDay()];
}

function formatDateLabel(dateKey) {
  const [year, month, day] = dateKey.split("-");
  return `${year}년 ${month}월 ${day}일`;
}

function formatDateTime(isoString) {
  if (!isoString) {
    return "";
  }

  const date = new Date(isoString);
  return Number.isNaN(date.getTime()) ? "" : `${getDateKeyFromDate(date)} ${formatTime(date)}`;
}

function formatTime(input) {
  if (!input) {
    return "";
  }

  const date = input instanceof Date ? input : new Date(input);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function formatElapsedDuration(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(Number(milliseconds) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) {
    return `${seconds}초`;
  }

  if (seconds === 0) {
    return `${minutes}분`;
  }

  return `${minutes}분 ${seconds}초`;
}

function formatScheduleItem(item, index) {
  const compactText = String(item || "").trim().replace(/\s+/g, " ");
  const matched = compactText.match(/^(\d+)\s*(?:교시)?\s*(.*)$/);

  if (matched) {
    const period = matched[1];
    const subject = matched[2]?.trim() || compactText;
    return { period, subject };
  }

  return {
    period: String(index + 1),
    subject: compactText,
  };
}

function parseLines(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function toTextareaValue(lines) {
  return normalizeStringArray(lines).join("\n");
}

function normalizeStringArray(value) {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
}

function normalizeStudentRoster(value) {
  const source = Array.isArray(value) ? value : DEFAULT_STUDENT_ROSTER;
  const seen = new Set();
  const roster = source
    .map((student) => {
      if (student && typeof student === "object" && !Array.isArray(student)) {
        return {
          id: String(student.id ?? student.number ?? "").trim(),
          number: String(student.number ?? student.id ?? "").trim(),
          name: String(student.name ?? "").trim(),
          nickname: String(student.nickname ?? "").trim(),
        };
      }

      return null;
    })
    .filter(Boolean)
    .filter((student) => {
      if (!student.id || !student.number || seen.has(student.id)) {
        return false;
      }

      seen.add(student.id);
      return true;
    });

  return roster.length > 0 ? roster : DEFAULT_STUDENT_ROSTER.map((student) => ({ ...student }));
}

function parseStudentRosterText(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return DEFAULT_STUDENT_ROSTER.map((student) => ({ ...student }));
  }

  const roster = [];
  const seen = new Set();

  lines.forEach((line) => {
    const parts = line.split(",").map((part) => part.trim());
    const number = parts[0] || "";

    if (!number || seen.has(number)) {
      return;
    }

    seen.add(number);
    roster.push({
      id: number,
      number,
      name: parts[1] || "",
      nickname: parts[2] || "",
    });
  });

  return roster.length > 0 ? roster : DEFAULT_STUDENT_ROSTER.map((student) => ({ ...student }));
}

function rosterToTextareaValue(roster) {
  return normalizeStudentRoster(roster)
    .map((student) => [student.number, student.name, student.nickname].filter((part) => part !== "").join(","))
    .join("\n");
}

function normalizeStudentDisplayMode(value) {
  const allowed = new Set(["number", "name", "nickname", "name-or-nickname"]);
  const mode = String(value || "").trim();
  return allowed.has(mode) ? mode : "name-or-nickname";
}

function clampPositiveInt(value, fallback, min, max) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(number)));
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function getFieldValue(form, name) {
  return String(form.elements.namedItem(name)?.value ?? "");
}

function setFieldValue(form, name, value) {
  const field = form.elements.namedItem(name);

  if (field) {
    field.value = value ?? "";
  }
}

function getFieldChecked(form, name) {
  return Boolean(form.elements.namedItem(name)?.checked);
}

function setFieldChecked(form, name, checked) {
  const field = form.elements.namedItem(name);

  if (field) {
    field.checked = Boolean(checked);
  }
}

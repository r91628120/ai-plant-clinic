/* =========================================
   AI植物診療師｜植物CSI教學平台
   AIAKOS v6.2 Stable｜Disease + Pest Risk Center
========================================= */

const form = document.querySelector("#diagnosisForm");
const promptOutput = document.querySelector("#promptOutput");
const generateBtn = document.querySelector("#generatePrompt");
const copyBtn = document.querySelector("#copyPrompt");
const clearBtn = document.querySelector("#clearPrompt");
const openStationBtn = document.querySelector("#openStation");
const modeInput = document.querySelector("#diagnosisMode");
const modeCards = document.querySelectorAll(".mode-card");
const modePanels = document.querySelectorAll(".mode-fields");
const fetchWeatherBtn = document.querySelector("#fetchWeatherBtn");
const fillWeatherBtn = document.querySelector("#fillWeatherBtn");

const WEATHER_API_URL = "https://script.google.com/macros/s/AKfycbw7zj9FmzzzciRlE2oGmrHsJhx5WjOFzjzwUvZXBocKnyFMF4o9YacQAZTwVUfit_Kh/exec";
const CORE_BASE = "https://r91628120.github.io/ai-agriculture-core";
const CORE_VERSION = "20260704";
const OFFICIAL_AZAI_BUG_URL = "https://azai.tari.gov.tw/search/bug";

let latestWeatherData = null;
let townshipData = {};
let AIAKOS_APP = null;
let diseaseDatabase = [];
let pestDatabase = [];

const COUNTY_FALLBACK_COORDS = {
  "基隆市": { lat: 25.1283, lng: 121.7419 },
  "臺北市": { lat: 25.0330, lng: 121.5654 },
  "台北市": { lat: 25.0330, lng: 121.5654 },
  "新北市": { lat: 25.0169, lng: 121.4628 },
  "桃園市": { lat: 24.9936, lng: 121.3010 },
  "新竹市": { lat: 24.8138, lng: 120.9675 },
  "新竹縣": { lat: 24.8387, lng: 121.0177 },
  "苗栗縣": { lat: 24.5602, lng: 120.8214 },
  "臺中市": { lat: 24.1477, lng: 120.6736 },
  "台中市": { lat: 24.1477, lng: 120.6736 },
  "彰化縣": { lat: 24.0518, lng: 120.5161 },
  "南投縣": { lat: 23.9609, lng: 120.9719 },
  "雲林縣": { lat: 23.7092, lng: 120.4313 },
  "嘉義市": { lat: 23.4801, lng: 120.4491 },
  "嘉義縣": { lat: 23.4518, lng: 120.2555 },
  "臺南市": { lat: 22.9999, lng: 120.2270 },
  "台南市": { lat: 22.9999, lng: 120.2270 },
  "高雄市": { lat: 22.6273, lng: 120.3014 },
  "屏東縣": { lat: 22.5519, lng: 120.5488 },
  "宜蘭縣": { lat: 24.7021, lng: 121.7378 },
  "花蓮縣": { lat: 23.9872, lng: 121.6015 },
  "臺東縣": { lat: 22.7972, lng: 121.0714 },
  "台東縣": { lat: 22.7972, lng: 121.0714 },
  "澎湖縣": { lat: 23.5711, lng: 119.5793 },
  "金門縣": { lat: 24.4321, lng: 118.3171 },
  "連江縣": { lat: 26.1602, lng: 119.9517 }
};

const modeInfo = {
  disease: {
    title: "病害診斷模式",
    role: "你是一位 AI植物診療師，擅長判讀植物病害、真菌/細菌/病毒性問題，並能用教學口吻引導學生觀察。",
    focus: "請優先分析病斑、腐爛、黴層、白粉、萎凋、發病部位與環境條件，但也要提醒可能與蟲害或生理障礙混淆。",
    extra: () => `病斑型態：${getValue("diseaseSpot")}\n是否有黴層或粉狀物：${getValue("diseaseMold")}`,
    answer: `1. 可能病害或原因排序\n列出 3 個最可能原因，包含病害、蟲害、生理障礙或管理因素。\n\n2. 判斷理由\n說明哪些症狀與環境資料支持你的推論。\n\n3. 還需要補充觀察\n列出學生下一步應拍攝或記錄的重點。\n\n4. 初步改善建議\n提供安全、教育用途的管理方向。\n\n5. 植物CSI學習重點\n用 3 個問題引導學生推理。\n\n6. 注意事項\n提醒勿直接用藥，需依作物、地區與法規確認。`
  },
  pest: {
    title: "蟲害偵查模式",
    role: "你是一位 AI植物診療師與農業害蟲偵查教學助理，擅長根據蟲體、卵、蛻皮、蟲糞、咬痕、蜜露與蛛絲進行初步判讀。",
    focus: "請優先分析害蟲種類或危害類型，例如刺吸式、咀嚼式、潛葉性、蛀食性或蟎類危害；若照片不足，請明確要求補拍。",
    extra: () => `是否看到蟲體：${getValue("pestVisible")}\n蟲體大小與顏色：${getValue("pestBody")}\n受害型態：${getValue("pestDamage")}\n蟲害痕跡：${getValue("pestTrace")}`,
    answer: `1. 最可能的害蟲或危害類型\n請列出可能性排序，並說明是刺吸式、咀嚼式、潛葉性、蛀食性或蟎類危害。\n\n2. 照片與症狀判斷依據\n說明你看到哪些蟲體、卵、咬痕、蟲糞、蜜露、蛛絲或葉片變化。\n\n3. 需要補拍的照片\n請告訴學生還要補拍葉背、蟲體近照、卵、蛀孔、果實或整株哪一類照片。\n\n4. 初步非農藥管理方法\n提供移除受害葉、清潔、隔離、誘捕、物理防治或環境管理建議。\n\n5. 是否可能誤判\n提醒是否可能是病害、生理障礙或藥害造成。\n\n6. 用藥注意事項\n若需要藥劑，提醒查詢合法登記藥劑、安全採收期與學校實作安全規範。\n\n7. 植物CSI學習重點\n用 3 個問題引導學生觀察害蟲生活史與危害痕跡。`
  },
  physiology: {
    title: "生理障礙診斷模式",
    role: "你是一位 AI植物診療師與植物生理教學助理，擅長判斷缺素、水分逆境、肥傷、鹽害、日燒、寒害、藥害與土壤環境問題。",
    focus: "請優先分析症狀分布、老葉或新葉、葉緣或葉脈間、土壤 pH、EC、濕度、溫度與管理紀錄，不要直接判定為病蟲害。",
    extra: () => `疑似逆境來源：${getValue("physioStress")}\n症狀分布：${getValue("physioDistribution")}`,
    answer: `1. 最可能的生理障礙排序\n列出 3 個可能原因，例如缺素、水分逆境、肥傷/鹽害、日燒、寒害或藥害。\n\n2. 判斷理由\n請根據症狀分布、土壤 pH、EC、濕度、溫度與管理紀錄說明。\n\n3. 與病蟲害的區別\n說明哪些地方不像病害或蟲害，哪些地方仍需確認。\n\n4. 建議補充檢測\n列出可再測量的項目，例如 pH、EC、土壤濕度、根系、施肥量與光照。\n\n5. 初步改善建議\n提供安全且適合教學現場的調整方向。\n\n6. 植物CSI學習重點\n用 3 個問題引導學生理解環境與植物生理的關係。`
  }
};

function getValue(name) {
  return new FormData(form).get(name)?.trim() || "未填寫";
}

function getMode() {
  return modeInput?.value || "disease";
}

function setMode(mode) {
  if (!modeInfo[mode]) return;
  modeInput.value = mode;

  modeCards.forEach((card) => {
    const active = card.dataset.mode === mode;
    card.classList.toggle("active", active);
    card.setAttribute("aria-selected", active ? "true" : "false");
  });

  modePanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === mode);
  });

  if (promptOutput) {
    promptOutput.placeholder = `目前選擇：${modeInfo[mode].title}。按下「產生診療提示詞」後會出現在這裡。`;
  }
}

function showValue(value, fallback = "--") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "number" && !Number.isFinite(value)) return fallback;
  if (value === "--") return fallback;
  return value;
}

function toNumber(value, fallback = null) {
  if (value === null || value === undefined || value === "" || value === "--") return fallback;
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  const text = String(value).trim();
  if (["low", "低", "無", "none", "trace"].includes(text.toLowerCase())) return 0;
  const match = text.match(/-?\d+(\.\d+)?/);
  if (!match) return fallback;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : fallback;
}

function formatNumber(value, digits = 1, fallback = "--") {
  const n = toNumber(value, null);
  if (n === null) return fallback;
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(digits).replace(/\.0$/, "");
}

function riskIcon(level) {
  if (level === "高") return "🔴";
  if (level === "中") return "🟡";
  if (level === "低") return "🟢";
  return "⚪";
}

function riskClassName(level) {
  if (level === "高") return "aia-risk-high";
  if (level === "中") return "aia-risk-medium";
  return "aia-risk-low";
}

function getRainRiskLevel(rainMm) {
  const n = toNumber(rainMm, null);
  if (n === null) return "未知";
  if (n >= 20) return "高";
  if (n >= 5) return "中";
  return "低";
}

function getWindRiskLevel(windSpeed) {
  const n = toNumber(windSpeed, null);
  if (n === null) return "未知";
  if (n >= 8) return "高";
  if (n >= 4) return "中";
  return "低";
}

function getDiseaseWeatherRisk(data) {
  const humidity = toNumber(data?.humidity, null);
  const rain = toNumber(data?.rainMm, 0);
  if (humidity === null) return "未知";
  if (humidity >= 85 || rain >= 10) return "高";
  if (humidity >= 75 || rain >= 3) return "中";
  return "低";
}

function getPestWeatherRisk(data) {
  const temp = toNumber(data?.temp, null);
  const humidity = toNumber(data?.humidity, null);
  const rain = toNumber(data?.rainMm, 0);
  const wind = toNumber(data?.windSpeed, 0);
  const mode = getMode();
  const pestVisible = getValue("pestVisible");
  const pestDamage = getValue("pestDamage");
  const pestTrace = getValue("pestTrace");

  let score = 0;
  const reasons = [];

  if (mode === "pest") {
    score += 25;
    reasons.push("目前使用蟲害偵查模式。");
  }
  if (pestVisible && !["未觀察", "沒有看到蟲體", "未填寫"].includes(pestVisible)) {
    score += 35;
    reasons.push(`已回報蟲體觀察：${pestVisible}。`);
  }
  if (pestDamage && !["未觀察", "未填寫"].includes(pestDamage)) {
    score += 20;
    reasons.push(`已回報受害型態：${pestDamage}。`);
  }
  if (pestTrace && !["未觀察", "沒有", "未填寫"].includes(pestTrace)) {
    score += 20;
    reasons.push(`已回報蟲害痕跡：${pestTrace}。`);
  }
  if (temp !== null && temp >= 24 && temp <= 34) {
    score += 12;
    reasons.push("目前溫度落在多數害蟲活躍區間。");
  }
  if (humidity !== null && humidity >= 60 && humidity <= 90) {
    score += 8;
    reasons.push("相對濕度適合部分害蟲活動與繁殖。");
  }
  if (rain >= 20) {
    score -= 10;
    reasons.push("較大雨量可能暫時降低部分小型害蟲活動。");
  }
  if (wind >= 8) {
    score -= 5;
    reasons.push("強風可能降低飛行性害蟲活動，但也可能造成傳播或傷口。");
  }

  if (score >= 60) return { level: "高", score: Math.min(score, 100), reasons };
  if (score >= 30) return { level: "中", score: Math.max(score, 0), reasons };
  return { level: "低", score: Math.max(score, 0), reasons: reasons.length ? reasons : ["目前未填寫明確蟲體、咬痕或蟲害痕跡，暫列低風險。"] };
}

async function loadJsonDatabase(fileName) {
  const res = await fetch(`./${fileName}?v=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`${fileName} 讀取失敗：HTTP ${res.status}`);
  const json = await res.json();

  if (Array.isArray(json)) return json;
  if (Array.isArray(json.diseases)) return json.diseases;
  if (Array.isArray(json.pests)) return json.pests;

  return [];
}

async function loadPlantDatabases() {
  const statusBox = document.querySelector("#dbStatusBox");

  try {
    diseaseDatabase = await loadJsonDatabase("diseases.json");
  } catch (error) {
    diseaseDatabase = [];
    console.warn(error.message);
  }

  try {
    pestDatabase = await loadJsonDatabase("pests.json");
  } catch (error) {
    pestDatabase = [];
    console.warn(error.message);
  }

  if (statusBox) {
    statusBox.textContent = `已讀取 diseases.json：${diseaseDatabase.length} 筆｜pests.json：${pestDatabase.length} 筆`;
  }

  console.log(`diseases.json：${diseaseDatabase.length} 筆`);
  console.log(`pests.json：${pestDatabase.length} 筆`);
}

function matchPestsByCrop(cropName) {
  const crop = (cropName || "").trim();
  if (!crop || crop === "未指定作物" || !pestDatabase.length) return [];
  return pestDatabase.filter((p) => {
    const crops = Array.isArray(p.crops) ? p.crops : [p.crop, p.host, p.hostCrop].filter(Boolean);
    return crops.some((c) => String(c).includes(crop) || crop.includes(String(c)));
  }).slice(0, 5);
}

function normalizeText(text) {
  return String(text || "").trim().toLowerCase();
}

function getItemCrops(item) {
  return Array.isArray(item.crops)
    ? item.crops
    : [item.crop, item.host, item.hostCrop].filter(Boolean);
}

function itemMatchesKeyword(item, cropKeyword, problemKeyword) {
  const crops = getItemCrops(item).map(String);
  const name = String(item.name || item.pestName || item.diseaseName || "");
  const id = String(item.id || "");
  const symptoms = Array.isArray(item.symptoms) ? item.symptoms.join(" ") : String(item.symptoms || "");
  const riskFactors = Array.isArray(item.riskFactors) ? item.riskFactors.join(" ") : "";

  const cropText = normalizeText(crops.join(" "));
  const problemText = normalizeText(`${name} ${id} ${symptoms} ${riskFactors}`);

  const cropOk = !cropKeyword || cropText.includes(cropKeyword);
  const problemOk = !problemKeyword || problemText.includes(problemKeyword);

  return cropOk && problemOk;
}

function searchPlantDatabase() {
  const cropKeyword = normalizeText(document.querySelector("#dbCropInput")?.value);
  const problemKeyword = normalizeText(document.querySelector("#dbProblemInput")?.value);
  const resultBox = document.querySelector("#databaseResults");

  if (!resultBox) return;

  if (!cropKeyword && !problemKeyword) {
    resultBox.innerHTML = `<div class="database-empty">請至少輸入「作物名稱」或「病害／蟲害名稱」。</div>`;
    return;
  }

  const diseaseResults = diseaseDatabase
    .filter((item) => itemMatchesKeyword(item, cropKeyword, problemKeyword))
    .map((item) => ({ ...item, databaseType: "disease" }));

  const pestResults = pestDatabase
    .filter((item) => itemMatchesKeyword(item, cropKeyword, problemKeyword))
    .map((item) => ({ ...item, databaseType: "pest" }));

  const results = [...diseaseResults, ...pestResults].slice(0, 60);

  if (!results.length) {
    resultBox.innerHTML = `
      <div class="database-empty">
        查無符合資料。可改用較短關鍵字，例如「番茄」、「炭疽」、「露菌」、「秋行軍」。
      </div>
    `;
    return;
  }

  resultBox.innerHTML = `
    <div class="database-empty">
      共找到 ${diseaseResults.length + pestResults.length} 筆資料，目前顯示前 ${results.length} 筆。
    </div>
    ${results.map(renderDatabaseResultCard).join("")}
  `;
}

function renderDatabaseResultCard(item) {
  const type = item.databaseType === "pest" ? "pest" : "disease";
  const typeLabel = type === "pest" ? "🐛 蟲害" : "🦠 病害";
  const name = item.name || item.pestName || item.diseaseName || "未命名資料";
  const crops = getItemCrops(item).join("、") || "未標示作物";
  const pathogenType = item.pathogenType || item.category || item.pestType || item.type || "未標示類型";
  const symptoms = Array.isArray(item.symptoms) && item.symptoms.length
    ? `<ul>${item.symptoms.slice(0, 5).map((s) => `<li>${s}</li>`).join("")}</ul>`
    : `<p>症狀／危害描述：${item.description || item.damage || "尚未建立完整描述。"}</p>`;

  const riskFactors = Array.isArray(item.riskFactors) && item.riskFactors.length
    ? `<p><strong>風險因子：</strong>${item.riskFactors.join("、")}</p>`
    : "";

  const advice = item.advice || item.management || item.control || "建議搭配官方資料與現場照片進一步確認。";
  const sourceUrl = item.sourceUrl || OFFICIAL_AZAI_BUG_URL;

  return `
    <article class="database-result-card ${type}">
      <div class="database-result-top">
        <span class="database-tag">${typeLabel}</span>
        <span class="database-tag">${pathogenType}</span>
      </div>

      <h3>${crops}｜${name}</h3>

      ${symptoms}
      ${riskFactors}

      <p><strong>初步建議：</strong>${advice}</p>

      <div class="database-source">
        來源：${item.source || "AIAKOS Database"}
        ｜ <a href="${sourceUrl}" target="_blank" rel="noopener">查看官方資料</a>
      </div>
    </article>
  `;
}

function clearPlantDatabaseSearch() {
  const cropInput = document.querySelector("#dbCropInput");
  const problemInput = document.querySelector("#dbProblemInput");
  const resultBox = document.querySelector("#databaseResults");

  if (cropInput) cropInput.value = "";
  if (problemInput) problemInput.value = "";

  if (resultBox) {
    resultBox.innerHTML = `<div class="database-empty">尚未查詢。請輸入作物名稱或病害／蟲害名稱。</div>`;
  }
}






function buildPestText(pestRisk) {
  if (!pestRisk) return "尚未產生蟲害分析。";
  const matched = Array.isArray(pestRisk.matchedPests) ? pestRisk.matchedPests : [];
  const pestLines = matched.length
    ? matched.map((p, i) => `- ${i + 1}. ${p.name || p.pestName || "未命名害蟲"}：${p.category || p.pestType || "蟲害"}。${p.advice || p.description || "請依官方資料與現場觀察確認。"}`).join("\n")
    : "- pests.json 尚未建立此作物的專屬害蟲資料，系統先依蟲體觀察、受害型態、氣象條件進行一般蟲害風險推估。";
  const reasons = Array.isArray(pestRisk.reasons) ? pestRisk.reasons.map((r) => `- ${r}`).join("\n") : "- 尚無細項理由。";
  return `蟲害偵查風險：${pestRisk.level || "--"}｜AI分數：${pestRisk.score ?? "--"}\n\n【判斷理由】\n${reasons}\n\n【可能相關害蟲】\n${pestLines}`;
}

function buildOfficialSearchUrl(type = "all") {
  const crop = getValue("crop");
  // AZAI 搜尋頁主要由站內搜尋框處理；為避免錯誤參數，先開啟官方病蟲害查詢入口。
  return OFFICIAL_AZAI_BUG_URL;
}

function openOfficialAzai(type = "all") {
  window.open(buildOfficialSearchUrl(type), "_blank", "noopener");
}

function updateOfficialVerifyText(data) {
  const box = document.querySelector("#officialVerifyText");
  if (!box) return;
  const crop = getValue("crop");
  const cropText = crop === "未填寫" ? "目前未指定作物" : `目前作物：${crop}`;
  const diseaseText = data?.diseaseRisk ? `病害氣象風險 ${data.diseaseRisk}` : "病害風險尚未讀取";
  const pestText = data?.pestRisk?.level ? `蟲害偵查風險 ${data.pestRisk.level}` : "蟲害風險尚未讀取";
  box.textContent = `${cropText}｜${diseaseText}｜${pestText}。建議點選上方官方資料中心，查詢作物對應病害與蟲害資料。`;
}

function normalizeWeather(raw = {}) {
  const rainMm = toNumber(raw.rainMm ?? raw.rainfall ?? raw.precipitation ?? raw.rain, 0);
  const windSpeed = toNumber(raw.windSpeed ?? raw.wind_speed ?? raw.wind, null);

  return {
    obsTime: raw.obsTime || raw.time || raw.observationTime || "--",
    temp: toNumber(raw.temp ?? raw.temperature, null),
    humidity: toNumber(raw.humidity ?? raw.rh, null),
    rainMm,
    windSpeed,
    sunshine: toNumber(raw.sunshine ?? raw.sunshineHour, null),
    soil10: toNumber(raw.soil10 ?? raw.soilTemp10 ?? raw.soilTemperature10cm, null)
  };
}

function normalizeStations(stations = []) {
  if (!Array.isArray(stations)) return [];
  return stations.map((s) => ({
    id: s.id || s.stationId || s.code || "--",
    name: s.name || s.stationName || "未命名測站",
    distanceKm: toNumber(s.distanceKm ?? s.distance, null),
    temp: toNumber(s.temp ?? s.temperature, null),
    humidity: toNumber(s.humidity ?? s.rh, null),
    rainMm: toNumber(s.rainMm ?? s.rainfall ?? s.rain, 0),
    windSpeed: toNumber(s.windSpeed ?? s.wind, null),
    sunshine: toNumber(s.sunshine, null)
  }));
}

function getCountyPosition(county) {
  return COUNTY_FALLBACK_COORDS[county] || { lat: 23.6978, lng: 120.9605 };
}

async function initAIAKOSCore() {
  const status = document.querySelector("#weatherStatus");
  try {
    if (typeof AIAgricultureApp !== "function") {
      throw new Error("尚未載入 AIAKOS.js，請確認 index.html 的 script 載入順序。");
    }

    AIAKOS_APP = new AIAgricultureApp();
    await AIAKOS_APP.init({
      weatherApi: WEATHER_API_URL,
      stationJson: `${CORE_BASE}/data/stations.json?v=${CORE_VERSION}`,
      cropJson: `${CORE_BASE}/data/crops.json?v=${CORE_VERSION}`,
      diseaseJson: `${CORE_BASE}/data/diseases.json?v=${CORE_VERSION}`,
      pestJson: `${CORE_BASE}/data/pests.json?v=${CORE_VERSION}`
    });

    console.log("AIAKOS v6.2 Core 已成功接入 AI植物診療師（含 pests.json）");
  } catch (error) {
    console.error("AIAKOS Core 初始化失敗：", error);
    if (status) status.textContent = `AIAKOS Core 初始化失敗：${error.message}`;
  }
}

function buildPrompt() {
  const mode = modeInfo[getMode()];
  const aiaText = latestWeatherData ? `\n\n【六、AIAKOS v6.2 農業氣象與病蟲害風險分析】\n${buildWeatherText(latestWeatherData)}` : "";

  return `${mode.role}\n\n${mode.focus}\n\n請根據以下問診資料，協助學生進行「${mode.title}」。\n請用教學口吻回答，避免直接下絕對診斷，並提醒仍需現場確認。\n\n【一、基本資料】\n作物名稱：\n${getValue("crop")}\n\n栽培地區：${getValue("clinicCounty")} ${getValue("clinicTown")}\n\n栽培環境：\n${getValue("environment")}\n\n【二、症狀資料】\n發病部位：\n${getValue("part")}\n\n主要症狀：\n${getValue("symptom")}\n\n發生時間：\n${getValue("time")}\n\n【三、環境與管理】\n近期天氣與氣象資料：\n${getValue("weather")}\n\n土壤溫度：\n${getValue("soilTemp")} °C\n\n土壤濕度：\n${getValue("soilMoisture")} %\n\n土壤 pH 值：\n${getValue("soilPH")}\n\n土壤 EC 值：\n${getValue("soilEC")} mS/cm\n\n管理紀錄：\n${getValue("management")}\n\n【四、照片觀察】\n照片說明：\n${getValue("photoNote")}\n\n【五、本模式補充觀察】\n${mode.extra()}${aiaText}\n\n請依照以下格式回答：\n\n${mode.answer}`;
}

function buildDiseaseText(diseaseRisk) {
  if (!diseaseRisk) return "尚未產生病害分析。";

  const diseases = Array.isArray(diseaseRisk.diseases) ? diseaseRisk.diseases : [];
  if (!diseases.length) {
    return diseaseRisk.summary || "目前無專屬病害資料，採一般病害風險推估。";
  }

  return diseases.map((d) => {
    const reasons = Array.isArray(d.reasons) && d.reasons.length ? `原因：${d.reasons.join("；")}` : "原因：目前未提供細項原因。";
    return `- ${d.name || "未命名病害"}：${d.level || "--"}，AI分數 ${d.score ?? "--"}。${reasons}`;
  }).join("\n");
}

function buildDecisionText(decision) {
  if (!decision) return "尚未產生 AI 農事建議。";
  const actions = Array.isArray(decision.farmActions) ? decision.farmActions : [];
  if (!actions.length) return decision.summary || "目前沒有額外農事建議。";
  return actions.map((item) => `- ${item}`).join("\n");
}

function buildWeatherText(data) {
  const stationText = (data.stations || [])
    .map((s, i) => `${i + 1}. ${s.name}（${s.id}，約 ${formatNumber(s.distanceKm)} km）`)
    .join("\n") || "--";

  return `【AIAKOS v6.2 三站融合農業氣象資料】\n融合測站：${data.stationName || "AIAKOS 三站融合"}\n融合測站數：${data.stationCount || "--"} 站\nAI可信度：${data.confidence || "--"}%\n觀測時間：${data.obsTime || "--"}\n\n【最近三個測站】\n${stationText}\n\n【融合後氣象資料】\n氣溫：${formatNumber(data.temp)} ℃\n相對濕度：${formatNumber(data.humidity)} %\n實測雨量：${formatNumber(data.rainMm)} mm\n風速：${formatNumber(data.windSpeed)} m/s\n日照時數：${formatNumber(data.sunshine)} hr\n土壤溫度10cm：${formatNumber(data.soil10)} ℃\n降雨風險：${data.rainRisk || "--"}\n風速風險：${data.windRisk || "--"}\n病害氣象風險：${data.diseaseRisk || "--"}\n蟲害偵查風險：${data.pestRisk?.level || "--"}｜AI分數：${data.pestRisk?.score ?? "--"}\n\n【可能病害分析】\n${buildDiseaseText(data.rawDiseaseRisk)}\n\n【可能蟲害分析】\n${buildPestText(data.pestRisk)}\n\n【AI農事建議】\n${buildDecisionText(data.rawDecision)}\n\n【植物診療提醒】\n請將以上 AIAKOS 三站融合氣象資料納入病害、蟲害與生理障礙判斷，特別注意高濕、連續降雨、高溫、強風與日照不足對植物健康的影響。`;
}

function updateWeatherCard(data) {
  document.querySelector("#weatherStatus").textContent =
    `已成功讀取 AIAKOS v6.2 三站融合資料｜AI可信度 ${data.confidence || "--"}%`;

  document.querySelector("#wStation").innerHTML = renderStationSummary(data.stations);
  document.querySelector("#wObsTime").textContent = data.obsTime || "--";
  document.querySelector("#wTemp").textContent = `${formatNumber(data.temp)} ℃`;
  document.querySelector("#wHumidity").textContent = `${formatNumber(data.humidity)} %`;
  document.querySelector("#wRain").innerHTML = `${formatNumber(data.rainMm)} mm<br><small>${riskIcon(data.rainRisk)} 降雨風險：${data.rainRisk}</small>`;
  document.querySelector("#wWind").innerHTML = `${formatNumber(data.windSpeed)} m/s<br><small>${riskIcon(data.windRisk)} 風速風險：${data.windRisk}</small>`;
  document.querySelector("#wSunshine").textContent = `${formatNumber(data.sunshine)} hr`;
  document.querySelector("#wDiseaseRisk").innerHTML = `${riskIcon(data.diseaseRisk)} ${data.diseaseRisk}`;
  const pestRiskEl = document.querySelector("#wPestRisk");
  if (pestRiskEl) {
    pestRiskEl.innerHTML = `${riskIcon(data.pestRisk?.level)} ${data.pestRisk?.level || "--"}<br><small>AI分數：${data.pestRisk?.score ?? "--"}</small>`;
  }
  updateOfficialVerifyText(data);
}

function renderStationSummary(stations = []) {
  if (!stations.length) return "AIAKOS 三站融合";
  return `AIAKOS 三站融合<br><small>${stations.map((s) => `${s.name} ${formatNumber(s.distanceKm)}km`).join("｜")}</small>`;
}

function renderAIAKOSDiagnosis(result, data) {
  const summaryBox = document.querySelector("#aiaRiskSummary");
  const listBox = document.querySelector("#aiaRiskList");
  if (!summaryBox || !listBox) return;

  const diseaseRisk = result?.diseaseRisk || {};
  const decision = result?.decision || {};
  const diseases = Array.isArray(diseaseRisk.diseases) ? diseaseRisk.diseases : [];
  const diseaseLevel = diseaseRisk.level || data?.diseaseRisk || "--";
  const pestRisk = data?.pestRisk || { level: "--", score: "--", reasons: [] };

  summaryBox.innerHTML = `
    <div><strong>整體病害風險：</strong><span class="${riskClassName(diseaseLevel)}">${riskIcon(diseaseLevel)} ${diseaseLevel}</span></div>
    <div><strong>蟲害偵查風險：</strong><span class="${riskClassName(pestRisk.level)}">${riskIcon(pestRisk.level)} ${pestRisk.level || "--"}</span>｜AI分數：${pestRisk.score ?? "--"}</div>
    <div><strong>AI可信度：</strong>${decision.confidenceScore ?? data?.confidence ?? "--"}%</div>
    <div><strong>摘要：</strong>${diseaseRisk.summary || "目前採一般氣象條件進行病害風險推估；蟲害則依 pests.json、蟲體觀察與氣象條件推估。"}</div>
  `;

  const stationHtml = (data?.stations || []).length ? `
    <div class="aia-risk-item">
      <strong>🌤 三站融合品質</strong><br>
      融合測站數：${data.stationCount || data.stations.length} 站｜AI融合可信度：${data.confidence || "--"}%<br>
      <small>${data.stations.map((s, i) => `${i + 1}. ${s.name}（${s.id}，約 ${formatNumber(s.distanceKm)} km）`).join("<br>")}</small>
    </div>
  ` : "";

  const diseaseHtml = diseases.length ? diseases.map((d, index) => `
    <div class="aia-risk-item">
      <strong>${index + 1}. ${d.name || "未命名病害"}</strong><br>
      風險等級：<span class="${riskClassName(d.level)}">${riskIcon(d.level)} ${d.level || "--"}</span>｜AI分數：${d.score ?? "--"}<br>
      <small>${Array.isArray(d.reasons) && d.reasons.length ? d.reasons.join("<br>") : "目前氣象條件未明顯達到專屬病害高風險門檻。"}</small><br>
      <strong>建議：</strong>${d.advice || "建議加強巡田觀察，必要時依照作物病害防治建議處理。"}
    </div>
  `).join("") : `
    <div class="aia-risk-item">
      <strong>🌿 一般病害風險推估</strong><br>
      目前 diseases.json 尚未建立此作物專屬病害模型，系統先依濕度、雨量與氣溫進行一般病害風險推估。<br>
      <small>${diseaseRisk.summary || "建議補充作物名稱，或後續擴充 diseases.json。"}</small>
    </div>
  `;

  const matchedPests = Array.isArray(pestRisk.matchedPests) ? pestRisk.matchedPests : [];
  const pestHtml = matchedPests.length ? matchedPests.map((p, index) => `
    <div class="aia-risk-item aia-risk-pest">
      <strong>🐛 ${index + 1}. ${p.name || p.pestName || "未命名害蟲"}</strong><br>
      類型：${p.category || p.pestType || "蟲害"}｜目前偵查風險：<span class="${riskClassName(pestRisk.level)}">${riskIcon(pestRisk.level)} ${pestRisk.level}</span><br>
      <small>${p.description || p.advice || "建議搭配官方病蟲害資料與現場照片確認。"}</small>
    </div>
  `).join("") : `
    <div class="aia-risk-item aia-risk-pest">
      <strong>🐛 一般蟲害偵查風險推估</strong><br>
      目前 pests.json 尚未建立此作物專屬害蟲資料，系統先依蟲體觀察、受害型態、蟲害痕跡與氣象條件推估。<br>
      <small>${Array.isArray(pestRisk.reasons) ? pestRisk.reasons.join("<br>") : "建議補充蟲體照片、葉背、卵、蟲糞、蜜露、蛛絲與受害部位。"}</small>
    </div>
  `;

  const officialHtml = `
    <div class="aia-risk-item aia-risk-official">
      <strong>🔎 官方資料交叉驗證</strong><br>
      建議到農業試驗所「農業病蟲害智慧管理決策系統」查詢作物病蟲害資料。<br>
      <button class="btn light" type="button" onclick="openOfficialAzai('all')">開啟官方病蟲害資料中心</button>
    </div>
  `;

  const decisionHtml = `
    <div class="aia-risk-item">
      <strong>🌾 AI農事建議</strong><br>
      <small>${buildDecisionText(decision).replaceAll("\n", "<br>")}</small>
    </div>
  `;

  listBox.innerHTML = stationHtml + diseaseHtml + pestHtml + officialHtml + decisionHtml;
}

async function fetchWeatherData() {
  const clinicCounty = document.querySelector("#clinicCounty")?.value || "";
  const clinicTown = document.querySelector("#clinicTown")?.value || "";
  const weatherCounty = document.querySelector("#weatherCounty")?.value || "";
  const weatherTown = document.querySelector("#weatherTown")?.value || "";

  const county = weatherCounty || clinicCounty;
  const town = weatherTown || clinicTown;
  const cropRaw = getValue("crop");
  const crop = cropRaw === "未填寫" ? "未指定作物" : cropRaw;

  if (!county || !town) {
    alert("請先選擇栽培地區");
    return;
  }

  if (!AIAKOS_APP) {
    document.querySelector("#weatherStatus").textContent = "AIAKOS Core 尚未初始化完成，請稍候再試。";
    return;
  }

  document.querySelector("#weatherStatus").textContent = "正在呼叫 AIAKOS Core 進行三站融合與病害風險分析...";

  try {
    const pos = getCountyPosition(county);
    const response = await AIAKOS_APP.analyzeFarmDecision({
      cropName: crop,
      stage: "植物診療",
      county,
      township: town,
      lat: pos.lat,
      lng: pos.lng
    });

    if (!response.success || !response.result || response.result.success !== true) {
      document.querySelector("#weatherStatus").textContent = response.error || response.result?.message || "AIAKOS Core 分析失敗";
      console.log(response);
      return;
    }

    const result = response.result;
    const weather = normalizeWeather(result.weather || {});
    const fusion = result.fusion || {};
    const stations = normalizeStations(fusion.stations || []);
    const confidence = fusion.quality?.confidence ?? result.decision?.confidenceScore ?? "--";
    const pestRisk = getPestWeatherRisk(weather);
    pestRisk.matchedPests = matchPestsByCrop(crop);

    latestWeatherData = {
      stationName: "AIAKOS 三站融合",
      stationId: stations.map((s) => s.id).join(" / "),
      obsTime: weather.obsTime,
      temp: weather.temp,
      humidity: weather.humidity,
      rainMm: weather.rainMm,
      windSpeed: weather.windSpeed,
      sunshine: weather.sunshine,
      soil10: weather.soil10,
      rainRisk: getRainRiskLevel(weather.rainMm),
      windRisk: getWindRiskLevel(weather.windSpeed),
      diseaseRisk: result.diseaseRisk?.level || getDiseaseWeatherRisk(weather),
      pestRisk,
      confidence,
      stationCount: fusion.stationCount || stations.length,
      stations,
      rawDiseaseRisk: result.diseaseRisk,
      rawDecision: result.decision,
      rawPrompt: result.prompt || ""
    };

    updateWeatherCard(latestWeatherData);
    renderAIAKOSDiagnosis(result, latestWeatherData);
  } catch (error) {
    document.querySelector("#weatherStatus").textContent = `讀取失敗：${error.message}`;
    console.error(error);
  }
}

function fillWeatherToForm() {
  if (!latestWeatherData) {
    alert("請先按「讀取最近農業氣象站資料」");
    return;
  }
  document.querySelector('[name="weather"]').value = buildWeatherText(latestWeatherData);
  alert("已將 AIAKOS v6.2 氣象與病蟲害風險資料帶入症狀問診表單！");
}

async function loadTownshipsForClinic() {
  try {
    const res = await fetch("./townships.json?v=20260622");
    townshipData = await res.json();
    setupTownshipSelect("clinicCounty", "clinicTown");
    setupTownshipSelect("weatherCounty", "weatherTown");
    setDefaultTownship("屏東縣", "枋山鄉");
  } catch (error) {
    console.error("townships.json 讀取失敗：", error);
    alert("townships.json 讀取失敗，請確認檔案是否與 index.html 放在同一層。");
  }
}

function setupTownshipSelect(countyId, townId) {
  const countySelect = document.querySelector(`#${countyId}`);
  const townSelect = document.querySelector(`#${townId}`);
  if (!countySelect || !townSelect) return;

  countySelect.innerHTML = "";
  Object.keys(townshipData).forEach((county) => {
    const option = document.createElement("option");
    option.value = county;
    option.textContent = county;
    countySelect.appendChild(option);
  });

  countySelect.addEventListener("change", () => updateTownshipOptions(countyId, townId));
  updateTownshipOptions(countyId, townId);
}

function updateTownshipOptions(countyId, townId) {
  const countySelect = document.querySelector(`#${countyId}`);
  const townSelect = document.querySelector(`#${townId}`);
  if (!countySelect || !townSelect) return;

  const towns = townshipData[countySelect.value] || [];
  townSelect.innerHTML = "";
  towns.forEach((town) => {
    const option = document.createElement("option");
    option.value = town;
    option.textContent = town;
    townSelect.appendChild(option);
  });
}

function setDefaultTownship(county, town) {
  ["clinicCounty", "weatherCounty"].forEach((countyId) => {
    const countySelect = document.querySelector(`#${countyId}`);
    if (countySelect && townshipData[county]) countySelect.value = county;
  });

  updateTownshipOptions("clinicCounty", "clinicTown");
  updateTownshipOptions("weatherCounty", "weatherTown");

  ["clinicTown", "weatherTown"].forEach((townId) => {
    const townSelect = document.querySelector(`#${townId}`);
    if (townSelect && [...townSelect.options].some((opt) => opt.value === town)) {
      townSelect.value = town;
    }
  });
}

function bindEvents() {
  modeCards.forEach((card) => card.addEventListener("click", () => setMode(card.dataset.mode)));

  if (generateBtn) {
    generateBtn.addEventListener("click", () => {
      promptOutput.value = buildPrompt();
      promptOutput.focus();
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      if (!promptOutput.value) promptOutput.value = buildPrompt();
      await navigator.clipboard.writeText(promptOutput.value);
      copyBtn.textContent = "已複製！";
      setTimeout(() => { copyBtn.textContent = "複製提示詞"; }, 1600);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      promptOutput.removeAttribute("readonly");
      promptOutput.value = "";
      promptOutput.setAttribute("readonly", true);
      promptOutput.placeholder = "提示詞已清除";
      clearBtn.textContent = "已清除！";
      setTimeout(() => { clearBtn.textContent = "一鍵清除提示詞"; }, 1500);
    });
  }


  if (openStationBtn) {
    openStationBtn.addEventListener("click", () => {
      const stationInput = document.querySelector("#stationUrl");
      const url = stationInput?.value.trim();
      if (!url) {
        alert("請先貼上自建氣象站網址");
        return;
      }
      window.open(url.startsWith("http") ? url : `https://${url}`, "_blank");
    });
  }

 const searchDatabaseBtn = document.querySelector("#searchDatabaseBtn");
const clearDatabaseBtn = document.querySelector("#clearDatabaseBtn");

if (searchDatabaseBtn) {
  searchDatabaseBtn.addEventListener("click", searchPlantDatabase);
}

if (clearDatabaseBtn) {
  clearDatabaseBtn.addEventListener("click", clearPlantDatabaseSearch);
}

["#dbCropInput", "#dbProblemInput"].forEach((selector) => {
  const input = document.querySelector(selector);
  if (input) {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        searchPlantDatabase();
      }
    });
  }
});



  if (fetchWeatherBtn) fetchWeatherBtn.addEventListener("click", fetchWeatherData);
  if (fillWeatherBtn) fillWeatherBtn.addEventListener("click", fillWeatherToForm);
}

document.addEventListener("DOMContentLoaded", async () => {
  bindEvents();
  setMode("disease");
  await initAIAKOSCore();
  await loadPlantDatabases();
  await loadTownshipsForClinic();
});

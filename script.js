/* =========================================
   AI植物診療師｜植物CSI教學平台
   script.js
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

const WEATHER_API_URL = "https://script.google.com/macros/s/AKfycbw7zj9FmzzzciRlE2oGmrHsJhx5WjOFzjzwUvZXBocKnyFMF4o9YacQAZTwVUfit_Kh/exec";

const fetchWeatherBtn = document.querySelector("#fetchWeatherBtn");
const fillWeatherBtn = document.querySelector("#fillWeatherBtn");
const weatherLocationInput = document.querySelector("#weatherLocationInput");

let latestWeatherData = null;
let townshipData = {};


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

  promptOutput.placeholder = `目前選擇：${modeInfo[mode].title}。按下「產生診療提示詞」後會出現在這裡。`;
}

modeCards.forEach((card) => {
  card.addEventListener("click", () => setMode(card.dataset.mode));
});

function buildPrompt() {
  const mode = modeInfo[getMode()];

  return `${mode.role}\n\n${mode.focus}\n\n請根據以下問診資料，協助學生進行「${mode.title}」。\n請用教學口吻回答，避免直接下絕對診斷，並提醒仍需現場確認。\n\n【一、基本資料】\n作物名稱：\n${getValue("crop")}\n\n栽培地區：${getValue("clinicCounty")} ${getValue("clinicTown")}\n\n栽培環境：\n${getValue("environment")}\n\n【二、症狀資料】\n發病部位：\n${getValue("part")}\n\n主要症狀：\n${getValue("symptom")}\n\n發生時間：\n${getValue("time")}\n\n【三、環境與管理】\n近期天氣與氣象資料：\n${getValue("weather")}\n\n土壤溫度：\n${getValue("soilTemp")} °C\n\n土壤濕度：\n${getValue("soilMoisture")} %\n\n土壤 pH 值：\n${getValue("soilPH")}\n\n土壤 EC 值：\n${getValue("soilEC")} mS/cm\n\n管理紀錄：\n${getValue("management")}\n\n【四、照片觀察】\n照片說明：\n${getValue("photoNote")}\n\n【五、本模式補充觀察】\n${mode.extra()}\n\n請依照以下格式回答：\n\n${mode.answer}`;
}

generateBtn.addEventListener("click", () => {
  promptOutput.value = buildPrompt();
  promptOutput.focus();
});

copyBtn.addEventListener("click", async () => {
  if (!promptOutput.value) promptOutput.value = buildPrompt();
  await navigator.clipboard.writeText(promptOutput.value);
  copyBtn.textContent = "已複製！";
  setTimeout(() => { copyBtn.textContent = "複製提示詞"; }, 1600);
});

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
    if (!stationInput) return;

    const url = stationInput.value.trim();
    if (!url) {
      alert("請先貼上自建氣象站網址");
      return;
    }

    const finalUrl = url.startsWith("http") ? url : `https://${url}`;
    window.open(finalUrl, "_blank");
  });
}


setMode("disease");

function buildWeatherText(data) {
  return `【即時農業氣象資料】
最近農業氣象站：${data.stationName || data.stationId || "--"}
觀測時間：${data.obsTime || "--"}
氣溫：${data.temp || "--"} ℃
相對濕度：${data.humidity || "--"} %
實測雨量：${data.rainMm || data.rain || "--"} mm
風速：${data.windSpeed || data.wind || "--"} m/s
日照時數：${data.sunshine || "--"} hr
土壤溫度10cm：${data.soil10 || "--"} ℃
降雨風險：${data.rain || "--"}
風速風險：${data.wind || "--"}

【植物診療提醒】
請將以上氣象資料納入病害、蟲害與生理障礙判斷，特別注意高濕、連續降雨、高溫、強風與日照不足對植物健康的影響。`;
}

function updateWeatherCard(data) {
  document.querySelector("#weatherStatus").textContent = "已成功讀取氣象資料";

  document.querySelector("#wStation").textContent =
    data.stationName || data.stationId || "--";

  document.querySelector("#wObsTime").textContent =
    data.obsTime || "--";

  document.querySelector("#wTemp").textContent =
    `${data.temp || "--"} ℃`;

  document.querySelector("#wHumidity").textContent =
    `${data.humidity || "--"} %`;

  document.querySelector("#wRain").textContent =
    `${data.rainMm || data.rain || "--"} mm`;

  document.querySelector("#wWind").textContent =
    `${data.windSpeed || data.wind || "--"} m/s`;

  document.querySelector("#wSunshine").textContent =
    `${data.sunshine || "--"} hr`;

  const humidity = Number(data.humidity);
  const rain = Number(data.rainMm || data.rain || 0);

  let diseaseRisk = "低";
  if (humidity >= 85 || rain >= 10) diseaseRisk = "高";
  else if (humidity >= 75 || rain >= 3) diseaseRisk = "中";

  document.querySelector("#wDiseaseRisk").textContent = diseaseRisk;
}

async function fetchWeatherData() {
  const clinicCounty = document.querySelector("#clinicCounty")?.value || "";
  const clinicTown = document.querySelector("#clinicTown")?.value || "";

  const weatherCounty = document.querySelector("#weatherCounty")?.value || "";
  const weatherTown = document.querySelector("#weatherTown")?.value || "";

  const formLocation = `${clinicCounty} ${clinicTown}`.trim();
  const inputLocation = `${weatherCounty} ${weatherTown}`.trim();

  const locationName = inputLocation || formLocation;

  if (!locationName) {
    alert("請先輸入栽培地區，例如：屏東縣 枋山鄉");
    return;
  }

 
  document.querySelector("#weatherStatus").textContent = "氣象資料讀取中...";

  try {
    const url = WEATHER_API_URL + "?location=" + encodeURIComponent(locationName);
    const res = await fetch(url);
    const data = await res.json();

    if (!data.success) {
      document.querySelector("#weatherStatus").textContent =
        data.message || "讀取失敗，請確認 GAS API 是否正常";
      return;
    }

    latestWeatherData = data;
    updateWeatherCard(data);

  } catch (error) {
    document.querySelector("#weatherStatus").textContent =
      "讀取失敗：" + error.message;
  }
}

function fillWeatherToForm() {
  if (!latestWeatherData) {
    alert("請先按「讀取最近農業氣象站資料」");
    return;
  }

  const weatherText = buildWeatherText(latestWeatherData);
  document.querySelector('[name="weather"]').value = weatherText;

  alert("已將氣象資料帶入症狀問診表單！");
}

if (fetchWeatherBtn) {
  fetchWeatherBtn.addEventListener("click", fetchWeatherData);
}

if (fillWeatherBtn) {
  fillWeatherBtn.addEventListener("click", fillWeatherToForm);
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

  countySelect.addEventListener("change", () => {
    updateTownshipOptions(countyId, townId);
  });

  updateTownshipOptions(countyId, townId);
}

function updateTownshipOptions(countyId, townId) {
  const countySelect = document.querySelector(`#${countyId}`);
  const townSelect = document.querySelector(`#${townId}`);
  if (!countySelect || !townSelect) return;

  const county = countySelect.value;
  const towns = townshipData[county] || [];

  townSelect.innerHTML = "";

  towns.forEach(town => {
    const option = document.createElement("option");
    option.value = town;
    option.textContent = town;
    townSelect.appendChild(option);
  });
}

function setDefaultTownship(county, town) {
  ["clinicCounty", "weatherCounty"].forEach(countyId => {
    const countySelect = document.querySelector(`#${countyId}`);
    if (countySelect && townshipData[county]) {
      countySelect.value = county;
    }
  });

  updateTownshipOptions("clinicCounty", "clinicTown");
  updateTownshipOptions("weatherCounty", "weatherTown");

  ["clinicTown", "weatherTown"].forEach(townId => {
    const townSelect = document.querySelector(`#${townId}`);
    if (townSelect && [...townSelect.options].some(opt => opt.value === town)) {
      townSelect.value = town;
    }
  });
}

loadTownshipsForClinic();



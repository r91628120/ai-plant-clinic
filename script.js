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
let AIAKOS_APP = null;

async function initAIAKOSCore() {
  try {
    AIAKOS_APP = new AIAgricultureApp();

    await AIAKOS_APP.init({
      weatherApi: WEATHER_API_URL,
      stationJson: "https://r91628120.github.io/ai-agriculture-core/data/stations.json?v=20260703",
      cropJson: "https://r91628120.github.io/ai-agriculture-core/data/crops.json?v=20260703",
      diseaseJson: "https://r91628120.github.io/ai-agriculture-core/data/diseases.json?v=20260703"
    });

    console.log("AIAKOS Core 已成功接入 AI植物診療師");
  } catch (error) {
    console.error("AIAKOS Core 初始化失敗：", error);
  }
}





const AGRI_STATIONS = [
  { id: "C2C410", name: "中央大學", lat: 24.9680, lng: 121.1950 },
  { id: "72C440", name: "桃園農改", lat: 24.9500, lng: 121.0300 },
  { id: "82A750", name: "茶改北部分場", lat: 24.9100, lng: 121.7000 },
  { id: "72D680", name: "桃改新埔分場", lat: 24.8300, lng: 121.0700 },
  { id: "K2E360", name: "苗栗農改", lat: 24.5600, lng: 120.8200 },
  { id: "G2F820", name: "農業試驗所", lat: 24.0300, lng: 120.6900 },
  { id: "72G600", name: "臺中農改", lat: 24.0000, lng: 120.5300 },
  { id: "72HA00", name: "中改埔里分場", lat: 23.9700, lng: 120.9700 },
  { id: "U2H480", name: "臺大溪頭", lat: 23.6740, lng: 120.7950 },
  { id: "A2K630", name: "臺大雲林校區", lat: 23.7000, lng: 120.5300 },
  { id: "C2M910", name: "嘉義大學", lat: 23.4630, lng: 120.4840 },
  { id: "72N100", name: "臺南農改", lat: 23.0500, lng: 120.3300 },
  { id: "72Q010", name: "高雄農改", lat: 22.9000, lng: 120.5300 },
  { id: "G2P820", name: "農試鳳山分所", lat: 22.6300, lng: 120.3500 },
  { id: "C2R970", name: "屏科大", lat: 22.6408, lng: 120.5960 },
  { id: "B2Q810", name: "畜試南區分所", lat: 22.5400, lng: 120.5300 },
  { id: "72S590", name: "東改賓朗果園", lat: 22.7900, lng: 121.0900 },
  { id: "72T250", name: "花蓮農改", lat: 23.9700, lng: 121.5900 },
  { id: "72U480", name: "花改蘭陽分場", lat: 24.7500, lng: 121.7500 }
];

const COUNTY_FALLBACK_COORDS = {
  "臺北市": { lat: 25.0330, lng: 121.5654 },
  "新北市": { lat: 25.0169, lng: 121.4628 },
  "桃園市": { lat: 24.9936, lng: 121.3010 },
  "臺中市": { lat: 24.1477, lng: 120.6736 },
  "臺南市": { lat: 22.9999, lng: 120.2270 },
  "高雄市": { lat: 22.6273, lng: 120.3014 },
  "屏東縣": { lat: 22.5519, lng: 120.5488 },
  "臺東縣": { lat: 22.7972, lng: 121.0714 },
  "花蓮縣": { lat: 23.9872, lng: 121.6015 }
};

function getMatchedWeatherStation(county, town) {
  const pos = COUNTY_FALLBACK_COORDS[county] || { lat: 23.6978, lng: 120.9605 };
  return findNearestStation(pos.lat, pos.lng);
}

function findNearestStation(lat, lng) {
  let best = null;

  AGRI_STATIONS.forEach(station => {
    const distanceKm = getDistanceKm(lat, lng, station.lat, station.lng);
    if (!best || distanceKm < best.distanceKm) {
      best = { ...station, distanceKm };
    }
  });

  return best;
}

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(value) {
  return value * Math.PI / 180;
}



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
 return `【AIAKOS 三站融合農業氣象資料】
    融合測站：${data.stationName || "--"}
    融合測站數：${data.stationCount || "--"} 站
    AI可信度：${data.confidence || "--"}%
    觀測時間：${data.obsTime || "--"}
    氣溫：${data.temp || "--"} ℃
    相對濕度：${data.humidity || "--"} %
    實測雨量：${data.rainMm || "--"} mm
    風速：${data.windSpeed || "--"} m/s
    日照時數：${data.sunshine || "--"} hr
    土壤溫度10cm：${data.soil10 || "--"} ℃
    降雨風險：${data.rain || "--"}
    風速風險：${data.wind || "--"}
    病害氣象風險：${data.diseaseRisk || "--"}

   【植物診療提醒】
    請將以上 AIAKOS 三站融合氣象資料納入病害、蟲害與生理障礙判斷，特別注意高濕、連續降雨、高溫、強風與日照不足對植物健康的影響。`;
}

function getRainRiskLevel(rainMm) {
  const n = Number(rainMm);
  if (Number.isNaN(n)) return "--";
  if (n >= 20) return "高";
  if (n >= 5) return "中";
  return "低";
}

function getWindRiskLevel(windSpeed) {
  const n = Number(windSpeed);
  if (Number.isNaN(n)) return "--";
  if (n >= 8) return "高";
  if (n >= 4) return "中";
  return "低";
}

function getDiseaseWeatherRisk(data) {
  const humidity = Number(data.humidity);
  const rain = Number(data.rainMm || 0);

  if (humidity >= 85 || rain >= 10) return "高";
  if (humidity >= 75 || rain >= 3) return "中";
  return "低";
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

  const county = weatherCounty || clinicCounty;
  const town = weatherTown || clinicTown;
  const crop = getValue("crop") || "未填寫作物";

  if (!county || !town) {
    alert("請先選擇栽培地區");
    return;
  }

  if (!AIAKOS_APP) {
    document.querySelector("#weatherStatus").textContent =
      "AIAKOS Core 尚未初始化完成，請稍候再試。";
    return;
  }

  document.querySelector("#weatherStatus").textContent =
    "正在呼叫 AIAKOS Core 進行三站融合分析...";

  try {
    const pos = COUNTY_FALLBACK_COORDS[county] || { lat: 23.6978, lng: 120.9605 };

    const response = await AIAKOS_APP.analyzeFarmDecision({
      cropName: crop,
      stage: "植物診療",
      county,
      township: town,
      lat: pos.lat,
      lng: pos.lng
    });

    if (!response.success || !response.result || response.result.success !== true) {
      document.querySelector("#weatherStatus").textContent =
        response.error || "AIAKOS Core 分析失敗";
      console.log(response);
      return;
    }

    const result = response.result;
    const weather = result.weather || {};
    const fusion = result.fusion || {};
    const stations = fusion.stations || [];

    latestWeatherData = {
      stationName: "AIAKOS 三站融合",
      stationId: stations.map(s => s.id || s.stationId).join(" / "),
      obsTime: weather.obsTime || "--",
      temp: weather.temp,
      humidity: weather.humidity,
      rainMm: weather.rainMm,
      windSpeed: weather.windSpeed,
      sunshine: weather.sunshine,
      soil10: weather.soil10,
      rain: getRainRiskLevel(weather.rainMm),
      wind: getWindRiskLevel(weather.windSpeed),
      diseaseRisk: getDiseaseWeatherRisk(weather),
      confidence: fusion.quality?.confidence || "--",
      stationCount: fusion.stationCount || stations.length,
      stations
    };

    updateWeatherCard(latestWeatherData);

  } catch (error) {
    document.querySelector("#weatherStatus").textContent =
      "讀取失敗：" + error.message;
    console.error(error);
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

document.addEventListener("DOMContentLoaded", async () => {
  await initAIAKOSCore();
  await loadTownshipsForClinic();
});



/* =========================================
   AI植物診療師｜植物CSI教學平台
   script.js
========================================= */


/* =========================================
   DOM 元件
========================================= */

const form = document.querySelector("#diagnosisForm");

const promptOutput = document.querySelector("#promptOutput");

const generateBtn = document.querySelector("#generatePrompt");

const copyBtn = document.querySelector("#copyPrompt");

const clearBtn = document.querySelector("#clearPrompt");

const openStationBtn = document.querySelector("#openStation");


/* =========================================
   取得表單資料
========================================= */

function getValue(name) {

  return (
    new FormData(form).get(name)?.trim() || "未填寫"
  );

}


/* =========================================
   建立 GPT 提示詞
========================================= */

function buildPrompt() {

  return `你是一位「AI植物診療師」與農業教學助理。

請根據以下問診資料，
協助學生進行植物病害、生理障礙、
或環境逆境的初步判斷。

請用教學口吻回答，
避免直接下絕對診斷，
並提醒仍需現場確認。



【一、基本資料】

作物名稱：
${getValue("crop")}

栽培地區：
${getValue("location")}

栽培環境：
${getValue("environment")}



【二、症狀資料】

發病部位：
${getValue("part")}

主要症狀：
${getValue("symptom")}

發生時間：
${getValue("time")}



【三、環境與管理】

近期天氣與氣象資料：
${getValue("weather")}

土壤溫度：
${getValue("soilTemp")} °C

土壤濕度：
${getValue("soilMoisture")} %

土壤 pH 值：
${getValue("soilPH")}

土壤 EC 值：
${getValue("soilEC")} mS/cm

管理紀錄：
${getValue("management")}



【四、照片觀察】

照片說明：
${getValue("photoNote")}



請依照以下格式回答：

1. 可能原因排序
列出 3 個最可能原因，
包含病害、蟲害、生理障礙或管理因素。

2. 判斷理由
說明哪些症狀與環境資料支持你的推論。

3. 還需要補充觀察
列出學生下一步應拍攝或記錄的重點。

4. 初步改善建議
提供安全、教育用途的管理方向。

5. 植物CSI學習重點
用 3 個問題引導學生推理。

6. 注意事項
提醒勿直接用藥，
需依作物、地區與法規確認。`;

}


/* =========================================
   產生 GPT 提示詞
========================================= */

generateBtn.addEventListener("click", () => {

  promptOutput.value = buildPrompt();

  promptOutput.focus();

});


/* =========================================
   複製提示詞
========================================= */

copyBtn.addEventListener("click", async () => {

  if (!promptOutput.value) {

    promptOutput.value = buildPrompt();

  }

  await navigator.clipboard.writeText(
    promptOutput.value
  );

  copyBtn.textContent = "已複製！";

  setTimeout(() => {

    copyBtn.textContent = "複製提示詞";

  }, 1600);

});


/* =========================================
   清除提示詞
========================================= */

if (clearBtn) {

  clearBtn.addEventListener("click", () => {

    promptOutput.removeAttribute("readonly");

    promptOutput.value = "";

    promptOutput.setAttribute(
      "readonly",
      true
    );

    promptOutput.placeholder =
      "提示詞已清除";

    clearBtn.textContent = "已清除！";

    setTimeout(() => {

      clearBtn.textContent =
        "一鍵清除提示詞";

    }, 1500);

  });

}


/* =========================================
   開啟自建氣象站
========================================= */

openStationBtn.addEventListener("click", () => {

  const url = document
    .querySelector("#stationUrl")
    .value
    .trim();

  if (!url) {

    alert("請先貼上自建氣象站網址");

    return;

  }

  const finalUrl = url.startsWith("http")
    ? url
    : `https://${url}`;

  window.open(finalUrl, "_blank");

});
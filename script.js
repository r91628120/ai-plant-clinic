const form = document.querySelector('#diagnosisForm');
const promptOutput = document.querySelector('#promptOutput');
const generateBtn = document.querySelector('#generatePrompt');
const copyBtn = document.querySelector('#copyPrompt');
const openStationBtn = document.querySelector('#openStation');

const clearBtn = document.getElementById("clearPrompt");

if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    document.getElementById("promptOutput").value = "";
  });
}


function getValue(name){ return new FormData(form).get(name)?.trim() || '未填寫'; }

function buildPrompt(){
  return `你是一位「AI植物診療師」與農業教學助理。請根據以下問診資料，協助學生進行植物病害、生理障礙或環境逆境的初步判斷。請用教學口吻回答，避免直接下絕對診斷，並提醒仍需現場確認。\n\n【一、基本資料】\n作物名稱：${getValue('crop')}\n栽培地區：${getValue('location')}\n栽培環境：${getValue('environment')}\n\n【二、症狀資料】\n發病部位：${getValue('part')}\n主要症狀：${getValue('symptom')}\n發生時間：${getValue('time')}\n\n【三、環境與管理】\n近期天氣與氣象資料：${getValue('weather')}\n管理紀錄：${getValue('management')}\n\n【四、照片觀察】\n照片說明：${getValue('photoNote')}\n\n請依照以下格式回答：\n1. 可能原因排序：列出 3 個最可能原因，包含病害、蟲害、生理障礙或管理因素。\n2. 判斷理由：說明哪些症狀與環境資料支持你的推論。\n3. 還需要補充觀察：列出學生下一步應拍攝或記錄的重點。\n4. 初步改善建議：提供安全、教育用途的管理方向。\n5. 植物CSI學習重點：用 3 個問題引導學生推理。\n6. 注意事項：提醒勿直接用藥，需依作物、地區與法規確認。`;
}

generateBtn.addEventListener('click', () => { promptOutput.value = buildPrompt(); promptOutput.focus(); });
copyBtn.addEventListener('click', async () => {
  if(!promptOutput.value) promptOutput.value = buildPrompt();
  await navigator.clipboard.writeText(promptOutput.value);
  copyBtn.textContent = '已複製！';
  setTimeout(()=> copyBtn.textContent = '複製提示詞', 1600);
});
openStationBtn.addEventListener('click', () => {
  const url = document.querySelector('#stationUrl').value.trim();
  if(!url) return alert('請先貼上自建氣象站網址');
  window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
});


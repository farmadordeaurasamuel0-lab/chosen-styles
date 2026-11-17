/* ===== Cronômetro do lançamento ===== */
const LAUNCH_AT = new Date("2026-11-10T00:00:00-03:00").getTime();
const pad2 = n => String(n).padStart(2, "0");
const tickCountdown = () => {
  const diff = Math.max(0, LAUNCH_AT - Date.now());
  $("cd-d").textContent = pad2(Math.floor(diff / 86400000));
  $("cd-h").textContent = pad2(Math.floor((diff % 86400000) / 3600000));
  $("cd-m").textContent = pad2(Math.floor((diff % 3600000) / 60000));
  $("cd-s").textContent = pad2(Math.floor((diff % 60000) / 1000));
  if (diff === 0) clearInterval(countdownTimer);
};
const countdownTimer = setInterval(tickCountdown, 1000);
tickCountdown();

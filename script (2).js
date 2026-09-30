/* ---------- Clinic settings: client ke hisaab se badal lein ---------- */
const CLINIC = {
  whatsapp: "920000000000",            // country code ke saath, bina + ke
  openDays: [1, 2, 3, 4, 5, 6],        // 0 = Sunday ... 6 = Saturday
  slots: ["10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30",
          "15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30"],
  storeKey: "dentalBookings"
};

const $ = (id) => document.getElementById(id);
const dateEl = $("date"), slotsEl = $("slots"), hintEl = $("slotHint"), errEl = $("error");
let chosenSlot = null;

/* ---------- Storage (demo: browser me save hota hai) ---------- */
function loadBookings() {
  try { return JSON.parse(localStorage.getItem(CLINIC.storeKey)) || []; }
  catch { return []; }
}
function saveBooking(b) {
  const all = loadBookings(); all.push(b);
  try { localStorage.setItem(CLINIC.storeKey, JSON.stringify(all)); } catch {}
}

/* ---------- Helpers ---------- */
const pad = (n) => String(n).padStart(2, "0");
function toISO(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function pretty(iso) {
  return new Date(iso + "T00:00").toLocaleDateString("en-GB",
    { weekday: "long", day: "numeric", month: "long" });
}
function label12(t) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? "pm" : "am"}`;
}
function nextOpenDate(from) {
  const d = new Date(from);
  while (!CLINIC.openDays.includes(d.getDay())) d.setDate(d.getDate() + 1);
  return d;
}

/* ---------- Slots ---------- */
function renderSlots() {
  chosenSlot = null; slotsEl.innerHTML = ""; errEl.textContent = "";
  const iso = dateEl.value;
  if (!iso) { hintEl.textContent = "Pehle date chunen."; return; }

  const day = new Date(iso + "T00:00").getDay();
  if (!CLINIC.openDays.includes(day)) {
    hintEl.textContent = "Clinic is din band hota hai. Koi aur date chunen.";
    return;
  }

  const taken = loadBookings().filter(b => b.date === iso).map(b => b.time);
  const now = new Date(), isToday = iso === toISO(now);
  let free = 0;

  CLINIC.slots.forEach(t => {
    const [h, m] = t.split(":").map(Number);
    const past = isToday && (h * 60 + m) <= (now.getHours() * 60 + now.getMinutes());
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = "slot";
    btn.setAttribute("role", "radio"); btn.setAttribute("aria-checked", "false");
    btn.textContent = label12(t);
    if (taken.includes(t) || past) btn.disabled = true; else free++;
    btn.addEventListener("click", () => {
      chosenSlot = t;
      slotsEl.querySelectorAll(".slot").forEach(s => s.setAttribute("aria-checked", "false"));
      btn.setAttribute("aria-checked", "true");
      errEl.textContent = "";
    });
    slotsEl.appendChild(btn);
  });
  hintEl.textContent = free ? `${free} slots available.` : "Is din koi slot khali nahi. Agli date try karen.";
}

/* ---------- Submit ---------- */
function confirmBooking() {
  const name = $("name").value.trim(), phone = $("phone").value.trim();
  const digits = phone.replace(/\D/g, "");

  if (!dateEl.value) return fail("Date chunen.");
  if (!chosenSlot) return fail("Time slot chunen.");
  if (name.length < 3) return fail("Apna poora naam likhen.");
  if (digits.length < 10 || digits.length > 13) return fail("Sahi phone number likhen, jaise 0300 1234567.");

  const b = { service: $("service").value, date: dateEl.value, time: chosenSlot, name, phone };
  saveBooking(b);

  $("summary").textContent = `${name}, aap ki ${b.service.toLowerCase()} ki appointment ${pretty(b.date)} ko ${label12(b.time)} par confirm hai.`;
  const msg = `Assalam o Alaikum, main ${name} hoon. Appointment: ${b.service}, ${pretty(b.date)}, ${label12(b.time)}. Phone: ${phone}`;
  $("waLink").href = `https://wa.me/${CLINIC.whatsapp}?text=${encodeURIComponent(msg)}`;

  $("formView").hidden = true; $("doneView").hidden = false;
}
function fail(m) { errEl.textContent = m; return false; }

function reset() {
  $("name").value = ""; $("phone").value = "";
  $("doneView").hidden = true; $("formView").hidden = false;
  renderSlots();
}

/* ---------- Init ---------- */
const today = new Date();
dateEl.min = toISO(today);
dateEl.value = toISO(nextOpenDate(today));
dateEl.addEventListener("change", renderSlots);
$("submitBtn").addEventListener("click", confirmBooking);
$("newBtn").addEventListener("click", reset);
$("year").textContent = today.getFullYear();
renderSlots();

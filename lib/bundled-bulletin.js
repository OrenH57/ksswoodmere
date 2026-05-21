const bundledBulletin = {
  source: {
    fileName: "weekly-bulletin-bamidbar-2026-05-15.pdf",
  },
  shabbat: {
    fridayNight: [
      { label: "Candle Lighting", time: "7:45 PM" },
      { label: "Shir Hashirim", time: "7:00 PM" },
      { label: "Mincha & Kabbalat Shabbat", time: "7:15 PM" },
      { label: "Shkia (Sunset)", time: "8:05 PM" },
      { label: "Tzeit HaKochavim", time: "8:23 PM" },
    ],
    morning: [
      { label: "Ben Ish Hai Class", time: "8:00 AM" },
      { label: "Shacharit - Korbanot", time: "8:30 AM" },
      { label: "Shacharit - Hodu", time: "8:45 AM" },
      { label: "Rabbi's Morning Speech", time: "10:50 AM" },
    ],
    latestShema: [
      { label: "M\"A", time: "8:26 AM" },
      { label: "Gr\"A", time: "9:14 AM" },
    ],
    afternoon: [
      { label: "Kids program with Avi", time: "5:15 PM" },
      { label: "Ladies Tehillim & Brachot", time: "6:00 PM" },
      { label: "Parsha Shiur", time: "6:45 PM" },
      { label: "Mincha", time: "7:15 PM" },
      { label: "Arvit", time: "8:30 PM" },
    ],
  },
  weekday: [
    { label: "Sunday Shacharit", time: "7:45 AM" },
    { label: "Monday-Friday Shacharit", time: "6:00 AM" },
    { label: "Daily Mincha & Arvit", time: "7:15 PM" },
  ],
  notes: {
    parsha: "Bamidbar",
    dateText: "15 May 2026",
  },
};

function loadBundledBulletin() {
  return JSON.parse(JSON.stringify(bundledBulletin));
}

module.exports = {
  loadBundledBulletin,
};

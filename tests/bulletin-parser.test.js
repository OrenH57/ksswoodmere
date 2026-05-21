const assert = require("node:assert/strict");
const { parseBulletinText } = require("../lib/bulletin-parser");

const sampleText = `
Kehilat Shaare Shalom
Parshat Bamidbar
Shabbat Schedule
FRIDAY NIGHT
Candle Lighting7:45
Shir Hashirim7:00
Mincha & Kabbalat Shabbat7:15
Shkia (Sunset) 8:05
Tzeit HaKochavim 8:23
SHABBAT MORNING
Ben Ish Hai Class 8:00
Shacharit · Korbanot 8:30
Shacharit · Hodu 8:45
LATEST SHEMA
M"A 8:26Gr"A 9:14
Rabbi's Morning Speech 10:50
SHABBAT AFTERNOON
Chazot (Midday) 12:51
Kids program with Avi 5:15
Ladies Tehillim & Brachot 6:00
Parsha Shiur 6:45
Mincha 7:15
Arvit 8:30
Shabbat Ends 8:45
Rabbenu Tam 9:18
WEEKDAY MINYANIM
Daily Schedule
SUNDAY
Shacharit · 7:45 AM
MON – FRI
Shacharit · 6:00 AM NEW
DAILY
Mincha & Arvit · 7:15 PM
`;

const parsed = parseBulletinText(sampleText);

assert.equal(parsed.notes.parsha, "Bamidbar");
assert.deepEqual(parsed.shabbat.fridayNight[0], { label: "Candle Lighting", time: "7:45 PM" });
assert.deepEqual(parsed.shabbat.morning[0], { label: "Ben Ish Hai Class", time: "8:00 AM" });
assert.deepEqual(parsed.shabbat.latestShema, [
  { label: "M\"A", time: "8:26 AM" },
  { label: "Gr\"A", time: "9:14 AM" },
]);
assert.deepEqual(parsed.shabbat.afternoon.at(-1), { label: "Rabbenu Tam", time: "9:18 PM" });
assert.deepEqual(parsed.weekday, [
  { label: "Sunday Shacharit", time: "7:45 AM" },
  { label: "Monday-Friday Shacharit", time: "6:00 AM" },
  { label: "Daily Mincha & Arvit", time: "7:15 PM" },
]);

const holidayText = `
Kehilat Shaare Shalom
Shavuot Schedule
May 21-23, 2026
EREV YOM TOV
Candle Lighting 7:49
Mincha & Arvit 7:20
FIRST DAY
Shacharit 8:30
Hallel 9:45
Torah Reading 10:15
Yizkor 11:00
Mussaf 11:20
YOM TOV AFTERNOON
Rabbi's Shiur 6:45
Mincha 7:25
Arvit 8:45
Yom Tov Ends 8:56
`;

const holiday = parseBulletinText(holidayText);

assert.deepEqual(holiday.shabbat.fridayNight, [
  { label: "Candle Lighting", time: "7:49 PM" },
  { label: "Mincha & Arvit", time: "7:20 PM" },
]);
assert.deepEqual(holiday.shabbat.morning.slice(0, 2), [
  { label: "Shacharit", time: "8:30 AM" },
  { label: "Hallel", time: "9:45 AM" },
]);
assert.deepEqual(holiday.shabbat.afternoon.at(-1), { label: "Yom Tov Ends", time: "8:56 PM" });

console.log("Bulletin parser test passed.");

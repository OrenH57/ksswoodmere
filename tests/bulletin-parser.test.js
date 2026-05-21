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
assert.equal(parsed.shabbat.fridayNight.length, 3);
assert.deepEqual(parsed.shabbat.morning[0], { label: "Ben Ish Hai Class", time: "8:00 AM" });
assert.deepEqual(parsed.shabbat.latestShema, []);
assert.deepEqual(parsed.shabbat.afternoon, [
  { label: "Kids program with Avi", time: "5:15 PM" },
  { label: "Ladies Tehillim & Brachot", time: "6:00 PM" },
  { label: "Parsha Shiur", time: "6:45 PM" },
  { label: "Mincha", time: "7:15 PM" },
  { label: "Arvit", time: "8:30 PM" },
]);
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
]);
assert.deepEqual(holiday.shabbat.morning.slice(0, 2), [
  { label: "Shacharit", time: "8:30 AM" },
]);
assert.deepEqual(holiday.shabbat.afternoon, [
  { label: "Rabbi's Shiur", time: "6:45 PM" },
  { label: "Mincha", time: "7:25 PM" },
  { label: "Arvit", time: "8:45 PM" },
]);

const shavuotText = `
Shavuot Schedule
T H U R S D AY   N I G H T
EREV SHAVUOT · MAY 21
Mincha & Arvit7:30 PM
Candle Lighting7:51 PM
Tikun Leil Shavuot11:30 PM
F R I D AY
1ST DAY SHAVUOT · MAY 22
Shaharit · Korbanot4:30 AM
Mincha · Kabbalat
Shabbat & Arvit
7:15 PM
Candle Lighting7:52 PM
S H A B B AT
2ND DAY SHAVUOT · MAY 23
Shaharit · Korbanot9:00 AM
LATEST SHEMA
M"A 8:23Gr"A 9:12
Kids Program · Ice Cream5:00 PM
Ladies Tehillim & Brachot6:00 PM
Men's & Ladies' Shiur6:45 PM
Mincha & Seudat Shlishit7:15 PM
Arvit · Motzei Shabbat / Hag8:40 PM
Chag Ends8:52 PM
Rabbenu Tam9:25 PM
— ◆ —
T I K U N   L E I L   S H A V U O T
`;

const shavuot = parseBulletinText(shavuotText);

assert.equal(shavuot.notes.holidayName, "Shavuot");
assert.deepEqual(shavuot.shabbat.thursdayNight, [
  { label: "Mincha & Arvit", time: "7:30 PM" },
  { label: "Candle Lighting", time: "7:51 PM" },
  { label: "Tikun Leil Shavuot", time: "11:30 PM" },
]);
assert.deepEqual(shavuot.shabbat.fridayNight, [
  { label: "Candle Lighting", time: "7:52 PM" },
  { label: "Mincha - Kabbalat Shabbat & Arvit", time: "7:15 PM" },
]);
assert.deepEqual(shavuot.shabbat.morning, [{ label: "Shaharit - Korbanot", time: "9:00 AM" }]);
assert.deepEqual(shavuot.shabbat.afternoon, [
  { label: "Kids Program - Ice Cream", time: "5:00 PM" },
  { label: "Ladies Tehillim & Brachot", time: "6:00 PM" },
  { label: "Men's & Ladies' Shiur", time: "6:45 PM" },
  { label: "Mincha & Seudat Shlishit", time: "7:15 PM" },
  { label: "Arvit - Motzei Shabbat / Hag", time: "8:40 PM" },
]);

console.log("Bulletin parser test passed.");

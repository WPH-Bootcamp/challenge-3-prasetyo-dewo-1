// ======================
// Habit Tracker CLI App
// ======================

const readline = require('readline');
const fs = require('fs');
const path = require('path');

// ===== KONSTANTA =====
const DATA_FILE = path.join(__dirname, 'habits-data.json');
const REMINDER_INTERVAL = 10000; // 10 detik
const DAYS_IN_WEEK = 7;

// ===== SETUP READLINE =====
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// ===== USER PROFILE OBJECT =====
const userProfile = {
  name: 'Saya adalah kamu',
  joinedAt: new Date(),
  habitsCreated: 0,
  updateStats(totalHabits) {
    this.habitsCreated = totalHabits;
  },
  getDaysJoined() {
    const diff = (new Date() - new Date(this.joinedAt)) / (1000 * 60 * 60 * 24);
    return Math.floor(diff);
  },
};

// ===== CLASS HABIT =====
class Habit {
  constructor(name, targetFrequency) {
    this.id = Date.now();
    this.name = name;
    this.targetFrequency = targetFrequency;
    this.completions = [];
    this.createdAt = new Date();
  }

  markComplete() {
    const today = new Date().toDateString();
    if (!this.completions.find((d) => new Date(d).toDateString() === today)) {
      this.completions.push(new Date());
      console.log(`✅ ${this.name} ditandai selesai untuk hari ini!`);
    } else {
      console.log(`⚠️  ${this.name} sudah ditandai selesai hari ini.`);
    }
  }

  getThisWeekCompletions() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    return this.completions.filter((d) => new Date(d) >= startOfWeek);
  }

  isCompletedThisWeek() {
    return this.getThisWeekCompletions().length >= this.targetFrequency;
  }

  getProgressPercentage() {
    const progress =
      (this.getThisWeekCompletions().length / this.targetFrequency) * 100;
    return Math.min(progress, 100);
  }

  getStatus() {
    return this.isCompletedThisWeek() ? '✅ Selesai' : '⏳ Aktif';
  }
}

// ===== CLASS HABIT TRACKER =====
class HabitTracker {
  constructor() {
    this.habits = [];
    this.reminder = null;
    this.loadFromFile();
  }

  addHabit(name, frequency) {
    this.habits.push(new Habit(name, frequency));
    userProfile.updateStats(this.habits.length);
    this.saveToFile();
  }

  completeHabit(index) {
    const habit = this.habits[index];
    if (habit) {
      habit.markComplete();
      this.saveToFile();
    } else console.log('⚠️  Habit tidak ditemukan.');
  }

  deleteHabit(index) {
    if (this.habits[index]) {
      console.log(`🗑️ Menghapus habit: ${this.habits[index].name}`);
      this.habits.splice(index, 1);
      this.saveToFile();
    } else console.log('⚠️  Habit tidak ditemukan.');
  }

  displayProfile() {
    console.log('\n=== PROFIL USER ===');
    console.log(`Nama: ${userProfile.name}`);
    console.log(`Hari sejak bergabung: ${userProfile.getDaysJoined()}`);
    console.log(`Total habit dibuat: ${userProfile.habitsCreated}`);
  }

  displayHabits(filter = null) {
    console.log('\n=== DAFTAR HABIT ===');
    let filtered = this.habits;
    if (filter === 'aktif')
      filtered = this.habits.filter((h) => !h.isCompletedThisWeek());
    if (filter === 'selesai')
      filtered = this.habits.filter((h) => h.isCompletedThisWeek());

    if (filtered.length === 0)
      return console.log('Belum ada habit untuk ditampilkan.');

    filtered.forEach((habit, i) => {
      const barLength = Math.floor(habit.getProgressPercentage() / 10);
      const bar = '█'.repeat(barLength) + '-'.repeat(10 - barLength);
      console.log(
        `${i + 1}. ${habit.name} [${bar}] ${habit
          .getProgressPercentage()
          .toFixed(0)}% (${habit.getStatus()})`
      );
    });
  }

  displayStats() {
    console.log('\n=== STATISTIK ===');
    const total = this.habits.length ?? 0;
    const selesai = this.habits.filter((h) => h.isCompletedThisWeek()).length;
    const aktif = total - selesai;
    console.log(`Total habit: ${total}`);
    console.log(`Selesai minggu ini: ${selesai}`);
    console.log(`Masih aktif: ${aktif}`);
  }

  displayHabitsWithWhile() {
    console.log('\n=== DEMO WHILE LOOP ===');
    let i = 0;
    while (i < this.habits.length) {
      console.log(`${i + 1}. ${this.habits[i].name}`);
      i++;
    }
  }

  displayHabitsWithFor() {
    console.log('\n=== DEMO FOR LOOP ===');
    for (let i = 0; i < this.habits.length; i++) {
      console.log(`${i + 1}. ${this.habits[i].name}`);
    }
  }

  // Reminder otomatis
  startReminder() {
    this.stopReminder();
    this.reminder = setInterval(() => this.showReminder(), REMINDER_INTERVAL);
  }

  showReminder() {
    console.log('\n🔔 Jangan lupa selesaikan kebiasaan harianmu hari ini!');
  }

  stopReminder() {
    if (this.reminder) clearInterval(this.reminder);
  }

  saveToFile() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(this.habits, null, 2));
  }

  loadFromFile() {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE));
      this.habits = data.map((h) => Object.assign(new Habit(), h));
      userProfile.updateStats(this.habits.length);
    }
  }

  clearAllData() {
    this.habits = [];
    this.saveToFile();
  }
}

// ===== CLI FUNCTIONS =====
function askQuestion(q) {
  return new Promise((res) => rl.question(q, res));
}

async function displayMenu() {
  console.log(`
==========================
   HABIT TRACKER MENU
==========================
1. Lihat Profil
2. Lihat Semua Kebiasaan
3. Lihat Kebiasaan Aktif
4. Lihat Kebiasaan Selesai
5. Tambah Kebiasaan Baru
6. Tandai Kebiasaan Selesai
7. Hapus Kebiasaan
8. Lihat Statistik
9. Demo Loop
0. Keluar
`);
}

async function handleMenu(tracker) {
  while (true) {
    await displayMenu();
    const choice = await askQuestion('Pilih menu: ');

    switch (choice) {
      case '1':
        tracker.displayProfile();
        break;
      case '2':
        tracker.displayHabits();
        break;
      case '3':
        tracker.displayHabits('aktif');
        break;
      case '4':
        tracker.displayHabits('selesai');
        break;
      case '5':
        const name = await askQuestion('Nama kebiasaan: ');
        const freq = await askQuestion('Target per minggu: ');
        tracker.addHabit(name, parseInt(freq));
        break;
      case '6':
        tracker.displayHabits();
        const idx = await askQuestion('Nomor kebiasaan yang selesai: ');
        tracker.completeHabit(parseInt(idx) - 1);
        break;
      case '7':
        tracker.displayHabits();
        const del = await askQuestion('Nomor kebiasaan yang dihapus: ');
        tracker.deleteHabit(parseInt(del) - 1);
        break;
      case '8':
        tracker.displayStats();
        break;
      case '9':
        tracker.displayHabitsWithWhile();
        tracker.displayHabitsWithFor();
        break;
      case '0':
        tracker.stopReminder();
        console.log('👋 Terima kasih sudah menggunakan Habit Tracker!');
        rl.close();
        return;
      default:
        console.log('❌ Pilihan tidak valid.');
    }
  }
}

// ===== MAIN FUNCTION =====
async function main() {
  console.log('🌟 Selamat datang di Habit Tracker CLI!');
  const tracker = new HabitTracker();
  tracker.startReminder();
  await handleMenu(tracker);
}

main();

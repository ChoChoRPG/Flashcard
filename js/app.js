document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  // Ambil parameter 'bab', bisa berisi "N5_1" atau "N5_1,N5_3,N4_1"
  const babIdsParam = urlParams.get("bab");
  const learningMode = urlParams.get("mode") || "bebas";

  // Ubah parameter string menjadi array ID
  const babIds = babIdsParam ? babIdsParam.split(",").filter(Boolean) : [];

  if (!babIds || babIds.length === 0) {
    document.getElementById("card-front").textContent = "Bab tidak ditemukan.";
    console.error("Parameter 'bab' tidak ada di URL.");
    return;
  }

  // Buat key unik untuk localStorage berdasarkan bab yang dipilih & diurutkan
  // Ini memastikan progres disimpan untuk "N5_1,N5_2" dan "N5_2,N5_1" di tempat yang sama
  const sortedBabKey = babIds.sort().join("_");
  const storageKey = `flashcardProgress_babs${sortedBabKey}_mode${learningMode}`;

  /**
   * --- LOGIKA LOADING BARU DENGAN FETCH ---
   * Memuat satu file data menggunakan fetch dan mengekstrak dataString.
   * @param {string} babId - ID Bab (misal "N5_1")
   * @returns {Promise<string>} - Promise yang resolve dengan dataString dari file
   */
  async function loadSingleDataScript(babId) {
    try {
      // Path ../js/ adalah relatif dari /sesi/sesi.html
      const response = await fetch(`../js/Data${babId}.js`);
      if (!response.ok) {
        throw new Error(
          `Gagal memuat Data${babId}.js (status: ${response.status})`
        );
      }
      const scriptText = await response.text();

      // Periksa apakah scriptText itu kosong
      if (!scriptText || scriptText.trim() === "") {
        console.warn(`Data${babId}.js kosong.`);
        return ""; // Kembalikan string kosong agar join tidak gagal
      }

      // Trik untuk mengekstrak 'dataString' tanpa 'eval()' penuh
      // Ini mengeksekusi "var dataString = '...';" dan mengembalikan 'dataString'
      const data = new Function(
        scriptText +
          '; return typeof dataString !== "undefined" ? dataString : undefined;'
      )();

      if (typeof data !== "undefined") {
        console.log(`Data${babId}.js loaded and parsed successfully.`);
        return data;
      } else {
        // Ini error jika file JS ada, tapi tidak mendefinisikan 'dataString'
        throw new Error(
          `dataString tidak terdefinisi di dalam Data${babId}.js`
        );
      }
    } catch (error) {
      console.error(`Error di loadSingleDataScript untuk ${babId}:`, error);
      // Lempar error lagi agar bisa ditangkap oleh Promise.all
      throw new Error(`Gagal memproses Data${babId}.js: ${error.message}`);
    }
  }

  /**
   * Memuat semua script data secara PARALEL (lebih cepat) menggunakan Fetch.
   * @param {string[]} babIds - Array ID bab
   * @param {function(string)} onCompleteCallback - Callback saat semua data digabung
   * @param {function(Error)} onErrorCallback - Callback jika ada error
   */
  async function loadAllDataScripts(
    babIds,
    onCompleteCallback,
    onErrorCallback
  ) {
    try {
      // Buat array berisi SEMUA promise (fetch)
      const allPromises = babIds.map((babId) => loadSingleDataScript(babId));

      // Tunggu SEMUA promise selesai secara paralel
      // Ini jauh lebih cepat daripada loop sekuensial
      const allDataStrings = await Promise.all(allPromises);

      // Gabungkan hasilnya (file yang kosong akan jadi string kosong, tidak masalah)
      onCompleteCallback(allDataStrings.join("\n"));
    } catch (error) {
      // Jika SATU saja gagal, Promise.all akan reject
      onErrorCallback(error);
    }
  }
  // --- AKHIR LOGIKA LOADING BARU ---

  // Panggil loadAllDataScripts
  loadAllDataScripts(
    babIds,
    (combinedData) => {
      // Semua data berhasil dimuat dan digabung
      // Set dataString global yang akan digunakan oleh initializeApp
      window.dataString = combinedData;
      initializeApp(); // Jalankan aplikasi
    },
    (error) => {
      // Terjadi error saat memuat salah satu file
      console.error(error);
      document.getElementById("card-front").textContent = error.message;
    }
  );

  // --- Fungsi Inisialisasi Aplikasi Utama ---
  // (Fungsi ini sekarang hanya akan dipanggil SETELAH semua data dimuat)
  function initializeApp() {
    // dataString sekarang ada di window.dataString (di-set oleh callback loadAllDataScripts)
    // Ini berisi data gabungan dari semua bab yang dipilih
    if (typeof dataString === "undefined" || dataString.trim() === "") {
      cardFront.textContent = "Data kosong atau tidak valid.";
      return;
    }

    document.body.classList.add("mode-" + learningMode);

    const appContainer = document.getElementById("app");
    const card = document.getElementById("flashcard");
    const cardFront = document.getElementById("card-front");
    const cardBack = document.getElementById("card-back");
    const cardCounter = document.getElementById("card-counter");
    const themeToggle = document.getElementById("theme-toggle-btn");
    const cardScene = document.querySelector(".card-scene");

    const prevButtonSVG = document.getElementById("prev-button-svg");
    const nextButtonSVG = document.getElementById("next-button-svg");
    const shuffleButtonBebas = document.getElementById("shuffle-button-bebas");

    const prevButtonTestSVG = document.getElementById("prev-button-svg-test");
    const correctButtonSVG = document.getElementById("correct-button-svg");
    const wrongButtonSVG = document.getElementById("wrong-button-svg");
    const shuffleButtonTest = document.getElementById("shuffle-button-test");

    const modal = document.getElementById("custom-modal");
    const modalText = document.getElementById("modal-text");
    const modalButtonYes = document.getElementById("modal-button-yes");
    const modalButtonNo = document.getElementById("modal-button-no");

    // Dapatkan elemen canvas konfeti
    const confettiCanvas = document.getElementById("confetti-canvas");
    const myConfetti = confettiCanvas
      ? confetti.create(confettiCanvas, { resize: true })
      : null;

    // ================== VARIABEL TTS ==================
    let isTtsEnabled = false;
    const synth = window.speechSynthesis;
    let isFirstTtsClick = true; // Untuk "membangunkan" suara di mobile
    // ================== AKHIR VARIABEL TTS =================

    let originalFlashcards = [];
    let currentFlashcards = [];
    let wrongPile = [];
    let wrongAnswerLog = {}; // <-- VARIABEL BARU UNTUK MELACAK FREKUENSI
    let currentCardIndex = 0;
    let sessionProgress = 1;
    let correctAnswers = 0;
    let totalCardCount = 0;
    let isFlipped = false;
    let isShuffled = false;

    // ================== FUNGSI TTS ==================
    /**
     * Membacakan teks yang diberikan menggunakan suara Jepang.
     * @param {string} text - Teks yang akan dibacakan.
     */
    function speak(text) {
      if (typeof synth === "undefined" || !synth || !text) {
        if (typeof synth === "undefined") {
          console.error("Speech Synthesis API tidak didukung.");
          // Nonaktifkan kedua tombol jika API tidak ada
          const ttsBtnBebas = document.getElementById("tts-button-bebas");
          const ttsBtnTest = document.getElementById("tts-button-test");
          if (ttsBtnBebas) ttsBtnBebas.style.display = "none";
          if (ttsBtnTest) ttsBtnTest.style.display = "none";
        }
        return;
      }

      if (synth.speaking) {
        synth.cancel(); // Hentikan jika sedang berbicara
      }

      const utterThis = new SpeechSynthesisUtterance(text);

      utterThis.onend = () => {
        // console.log("Speech finished.");
      };

      utterThis.onerror = (e) => {
        console.error("SpeechSynthesisUtterance.onerror", e);
      };

      // Ambil daftar suara SETIAP KALI fungsi speak dipanggil.
      const allVoices = synth.getVoices();

      if (allVoices.length === 0) {
        console.warn(
          "Daftar suara (getVoices) masih kosong. TTS mungkin gagal atau salah logat."
        );
      }

      // Cari suara Jepang (ja-JP)
      let japaneseVoice = allVoices.find((voice) => voice.lang === "ja-JP");

      // Fallback jika tidak ada suara ja-JP spesifik, cari yang depannya "ja"
      if (!japaneseVoice) {
        japaneseVoice = allVoices.find((voice) => voice.lang.startsWith("ja"));
      }

      if (japaneseVoice) {
        utterThis.voice = japaneseVoice;
      } else {
        // Jika tidak ada suara Jepang, setidaknya setel bahasa
        utterThis.lang = "ja-JP";
        console.warn(
          "Suara ja-JP tidak ditemukan. Menggunakan default browser (ini mungkin penyebab logat salah)."
        );
      }

      utterThis.pitch = 1;
      utterThis.rate = 0.8; // Kecepatan normal adalah 1, dibuat sedikit lebih lambat
      synth.speak(utterThis);
    }
    // ================== AKHIR FUNGSI TTS =================

    // Parsing data gabungan
    for (const line of dataString.trim().split("\n")) {
      if (line.trim() === "" || line.startsWith(";")) continue;
      try {
        const parts = line.split(",");
        if (parts.length < 3) continue;
        const front = parts[0].trim();
        const hiragana = parts[1].trim();
        const level = parts[parts.length - 1].trim();
        let definition = parts
          .slice(2, parts.length - 1)
          .join(",")
          .trim();
        if (definition.startsWith('"') && definition.endsWith('"')) {
          definition = definition.substring(1, definition.length - 1);
        }
        const backHTML = `<div class="hiragana">${hiragana}</div><div class="definition">${definition}</div><div class="level">${level}</div>`;

        // Simpan juga definisi mentah dan hiragana untuk TTS
        originalFlashcards.push({
          front,
          back: backHTML,
          hiragana: hiragana,
          definition: definition, // <-- Simpan definisi mentah
          answered: null,
        });
      } catch (e) {
        console.error("Gagal mem-parsing baris:", line, e);
      }
    }

    if (originalFlashcards.length === 0) {
      cardFront.textContent = "Tidak ada kartu untuk ditampilkan.";
      const controls = document.getElementById("controls-container");
      if (controls) controls.style.display = "none";
      return;
    }

    totalCardCount = originalFlashcards.length;

    function showModal(text, yesCallback, noCallback) {
      modalText.textContent = text;
      modal.style.display = "flex";

      modalButtonYes.textContent = "Ya";
      modalButtonNo.textContent = "Tidak";

      modalButtonYes.addEventListener(
        "click",
        function handleYes() {
          modal.style.display = "none";
          if (yesCallback) yesCallback();
        },
        { once: true }
      );
      if (noCallback) {
        modalButtonNo.style.display = "inline-block";
        modalButtonNo.addEventListener(
          "click",
          function handleNo() {
            modal.style.display = "none";
            noCallback();
          },
          { once: true }
        );
      } else {
        modalButtonYes.textContent = "Selesai";
        modalButtonNo.style.display = "none";
      }
    }

    /**
     * FUNGSI BARU: Menampilkan rekap sesi tes
     * @param {object} log - Objek wrongAnswerLog
     */
    function showTestRecap(log) {
      const appContainer = document.getElementById("app");
      const recapContainer = document.getElementById("recap-container");
      const recapTableBody = document.getElementById("recap-table-body");
      const headerControls = document.querySelector(".header-controls");

      const logEntries = Object.values(log);

      // Jika tidak ada kesalahan, tampilkan modal sukses biasa dan redirect
      if (logEntries.length === 0) {
        showModal(
          "Sesi Tes Selesai! Anda Benar Semua.",
          () => {
            window.location.href = "../index.html";
          },
          null // Tidak ada tombol "Tidak"
        );
        return;
      }

      // 1. Sembunyikan UI utama
      if (appContainer) appContainer.style.display = "none";
      if (headerControls) headerControls.style.display = "none";

      // 2. Siapkan data tabel
      logEntries.sort((a, b) => b.count - a.count); // Urutkan berdasarkan frekuensi (terbanyak dulu)
      recapTableBody.innerHTML = ""; // Kosongkan isi tabel sebelumnya

      logEntries.forEach((entry, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${entry.card.front}</td>
          <td>${entry.card.definition}</td>
          <td>${entry.count}</td>
        `;
        recapTableBody.appendChild(row);
      });

      // 3. Tampilkan UI Rekap
      if (recapContainer) recapContainer.style.display = "block";
    }

    function saveProgress() {
      try {
        const progress = {
          currentFlashcards: currentFlashcards,
          wrongPile: wrongPile,
          currentCardIndex: currentCardIndex,
          sessionProgress: sessionProgress,
          correctAnswers: correctAnswers,
          totalCardCount: totalCardCount,
          isShuffled: isShuffled,
          wrongAnswerLog: wrongAnswerLog, // <-- SIMPAN LOG
        };
        // Gunakan storageKey unik yang sudah dibuat
        localStorage.setItem(storageKey, JSON.stringify(progress));
      } catch (e) {
        console.error("Gagal menyimpan progres ke localStorage:", e);
      }
    }

    function clearProgress() {
      localStorage.removeItem(storageKey);
      wrongAnswerLog = {}; // <-- RESET LOG SAAT PROGRES DIHAPUS
    }

    function loadProgress(onProgressLoaded) {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        showModal(
          "Ditemukan sesi terakhir yang belum selesai. Lanjutkan?",
          () => {
            const progress = JSON.parse(savedData);
            currentFlashcards = progress.currentFlashcards;
            wrongPile = progress.wrongPile;
            currentCardIndex = progress.currentCardIndex;
            sessionProgress = progress.sessionProgress;
            correctAnswers = progress.correctAnswers;
            totalCardCount =
              progress.totalCardCount || originalFlashcards.length;
            isShuffled = progress.isShuffled;
            wrongAnswerLog = progress.wrongAnswerLog || {}; // <-- LOAD LOG
            if (shuffleButtonBebas)
              shuffleButtonBebas.classList.toggle("active", isShuffled);
            if (shuffleButtonTest)
              shuffleButtonTest.classList.toggle("active", isShuffled);
            onProgressLoaded(true);
          },
          () => {
            clearProgress(); // Ini akan me-reset wrongAnswerLog juga
            onProgressLoaded(false);
          }
        );
      } else {
        onProgressLoaded(false);
      }
    }

    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    }

    function updateCounter() {
      if (learningMode === "bebas") {
        cardCounter.textContent = `${sessionProgress} / ${originalFlashcards.length}`;
      } else {
        cardCounter.textContent = `${currentCardIndex + 1} / ${
          currentFlashcards.length
        }`;
      }
    }

    function showCard(index) {
      if (!currentFlashcards || currentFlashcards.length === 0) return;
      currentCardIndex =
        (index + currentFlashcards.length) % currentFlashcards.length;
      const newCardData = currentFlashcards[currentCardIndex];
      if (!newCardData) return;

      const textToDisplay = newCardData.front;
      cardFront.textContent = textToDisplay;
      cardBack.innerHTML = newCardData.back;
      updateCounter();
    }

    /**
     * DIUBAH TOTAL: Fungsi ini sekarang menjadi toggle ON/OFF
     * Saat ON: Mengacak sisa kartu
     * Saat OFF: Mengurutkan sisa kartu
     */
    function toggleShuffle() {
      isShuffled = !isShuffled; // Toggle status

      // Update UI tombol
      if (shuffleButtonBebas)
        shuffleButtonBebas.classList.toggle("active", isShuffled);
      if (shuffleButtonTest)
        shuffleButtonTest.classList.toggle("active", isShuffled);

      // Ambil kartu yang sudah dilihat (termasuk yang sekarang)
      const seenCards = currentFlashcards.slice(0, currentCardIndex + 1);

      // Ambil kartu yang tersisa
      let remainingCards = currentFlashcards.slice(currentCardIndex + 1);

      // Jika sisa kartu kurang dari 2, tidak ada yang perlu diacak/diurutkan
      if (remainingCards.length < 2) {
        saveProgress(); // Cukup simpan status isShuffled yang baru
        return;
      }

      if (isShuffled) {
        // --- PENGGUNA BARU MENYALAKAN ACAN ---
        // Acak HANYA kartu yang tersisa
        shuffleArray(remainingCards);

        // Gabungkan kembali array: kartu lama + sisa kartu yang sudah teracak
        currentFlashcards = seenCards.concat(remainingCards);

        // Beri umpan balik visual
        if (cardScene) {
          cardScene.style.transform = "scale(1.05)";
          setTimeout(() => {
            cardScene.style.transform = "scale(1)";
          }, 150);
        }
      } else {
        // --- PENGGUNA BARU MEMATIKAN ACAN ---
        // Kita perlu mengurutkan 'remainingCards' kembali ke urutan aslinya.

        // 1. Buat Peta (Map) untuk urutan asli agar pencarian cepat
        //    Kita hanya perlu melakukan ini sekali jika belum ada
        if (!window.originalOrderMap) {
          window.originalOrderMap = new Map();
          originalFlashcards.forEach((card, index) => {
            // Gunakan 'front' (Kanji) sebagai ID unik
            window.originalOrderMap.set(card.front, index);
          });
        }

        // 2. Urutkan 'remainingCards' berdasarkan posisi aslinya di 'originalOrderMap'
        remainingCards.sort((a, b) => {
          const orderA = window.originalOrderMap.get(a.front);
          const orderB = window.originalOrderMap.get(b.front);
          return orderA - orderB;
        });

        // 3. Gabungkan kembali array
        currentFlashcards = seenCards.concat(remainingCards);

        // Beri umpan balik visual
        if (cardScene) {
          cardScene.style.transform = "scale(0.95)";
          setTimeout(() => {
            cardScene.style.transform = "scale(1)";
          }, 150);
        }
      }

      // Simpan status baru dan urutan kartu yang baru
      saveProgress();
    }

    function flipCard() {
      if (currentFlashcards.length === 0) return;

      isFlipped = !isFlipped;
      card.classList.toggle("is-flipped");

      if (isFlipped && isTtsEnabled && synth) {
        const cardData = currentFlashcards[currentCardIndex];
        if (cardData && cardData.hiragana) {
          setTimeout(() => {
            speak(cardData.hiragana);
          }, 300);
        }
      } else if (!isFlipped && synth) {
        synth.cancel();
      }
    }

    function transitionToCard(newIndex) {
      if (appContainer.classList.contains("is-changing")) return;

      if (synth && synth.speaking) {
        synth.cancel();
      }

      const flipFirst = isFlipped;

      const changeCardContent = () => {
        appContainer.classList.add("is-changing");
        try {
          setTimeout(() => {
            showCard(newIndex);
          }, 150);
        } catch (e) {
          console.error("Error saat transisi kartu:", e);
        } finally {
          setTimeout(() => {
            appContainer.classList.remove("is-changing");
          }, 200);
        }
      };

      if (flipFirst) {
        isFlipped = false;
        card.classList.remove("is-flipped");
        setTimeout(changeCardContent, 300);
      } else {
        changeCardContent();
      }
    }

    function prevCard() {
      if (currentCardIndex > 0) {
        if (learningMode === "bebas" && sessionProgress > 1) {
          sessionProgress--;
        }

        transitionToCard(currentCardIndex - 1);
        saveProgress();
      }
    }

    function triggerConfetti() {
      if (!myConfetti) return;
      myConfetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
      });

      setTimeout(() => myConfetti.reset(), 4000);
    }

    function nextCard() {
      if (learningMode !== "bebas" || currentFlashcards.length === 0) return;

      if (sessionProgress >= originalFlashcards.length) {
        triggerConfetti();
        clearProgress();

        setTimeout(() => {
          window.location.href = "../index.html";
        }, 1000);
      } else {
        sessionProgress++;
        const nextIndexInCurrent =
          (currentCardIndex + 1) % currentFlashcards.length;
        transitionToCard(nextIndexInCurrent);
        saveProgress();
      }
    }

    function checkTestRound() {
      if (currentCardIndex + 1 >= currentFlashcards.length) {
        if (wrongPile.length > 0) {
          setTimeout(() => {
            showModal(
              `Putaran selesai. Anda masih salah ${wrongPile.length} kartu. Mulai putaran baru dengan kartu yang salah?`,
              () => {
                currentFlashcards = [...wrongPile];
                wrongPile = [];
                currentCardIndex = 0;
                correctAnswers = 0;
                totalCardCount = currentFlashcards.length;
                currentFlashcards.forEach((c) => (c.answered = null));
                // Acak kartu yang salah untuk putaran baru jika mode acak masih aktif
                if (isShuffled) shuffleArray(currentFlashcards);
                saveProgress();
                transitionToCard(0);
              },
              () => {
                clearProgress();
                window.location.href = "../index.html";
              }
            );
          }, 500);
        } else {
          // --- INI BAGIAN YANG DIPERBARUI ---
          triggerConfetti();
          const finalLog = { ...wrongAnswerLog }; // Salin log sebelum di-reset
          clearProgress(); // Hapus progres dari storage

          setTimeout(() => {
            // Panggil fungsi rekap baru
            showTestRecap(finalLog);
          }, 500);
          // --- AKHIR BAGIAN YANG DIPERBARUI ---
        }
        return true;
      }
      return false;
    }

    function handleCorrect() {
      if (learningMode !== "test" || currentFlashcards.length === 0) return;

      const currentCardData = currentFlashcards[currentCardIndex];

      if (currentCardData.answered !== "correct") {
        currentCardData.answered = "correct";
        correctAnswers++;
        const wrongIndex = wrongPile.findIndex(
          (c) => c.front === currentCardData.front
        );
        if (wrongIndex > -1) {
          wrongPile.splice(wrongIndex, 1);
        }
      }

      updateCounter();
      saveProgress();

      transitionToCard(currentCardIndex + 1);

      setTimeout(() => {
        checkTestRound();
      }, 400);
    }

    function handleWrong() {
      if (learningMode !== "test" || currentFlashcards.length === 0) return;
      const cardData = currentFlashcards[currentCardIndex];

      // --- LOGIKA PELACAKAN FREKUENSI BARU ---
      const cardId = cardData.front; // Gunakan kanji sebagai ID unik
      const currentCount = wrongAnswerLog[cardId]?.count || 0;
      wrongAnswerLog[cardId] = {
        count: currentCount + 1,
        card: { ...cardData }, // Simpan salinan data kartu (termasuk definisi)
      };
      // --- AKHIR LOGIKA PELACAKAN ---

      if (cardData.answered === "correct") {
        correctAnswers--;
      }
      cardData.answered = "wrong";

      if (!wrongPile.find((c) => c.front === cardData.front)) {
        wrongPile.push({ ...cardData });
      }

      updateCounter();
      saveProgress(); // Simpan progres (termasuk wrongAnswerLog)

      transitionToCard(currentCardIndex + 1);

      setTimeout(() => {
        checkTestRound();
      }, 400);
    }

    function handleThemeToggle() {
      const isDarkMode = document.body.classList.toggle("dark-mode");
      localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    }

    /**
     * FUNGSI BARU: Menginisialisasi tombol TTS
     * @param {HTMLElement} buttonElement - Elemen tombol (bisa bebas atau test)
     */
    function initializeTtsButton(buttonElement) {
      if (!buttonElement) return;

      if (typeof synth === "undefined") {
        buttonElement.style.display = "none";
        return;
      }

      // Sinkronkan tampilan tombol dengan status global saat di-load
      buttonElement.classList.toggle("active", isTtsEnabled);

      buttonElement.addEventListener("click", () => {
        isTtsEnabled = !isTtsEnabled; // Toggle status global

        // Update tampilan tombol INI
        buttonElement.classList.toggle("active", isTtsEnabled);

        // Update juga tombol pasangannya agar sinkron
        const otherButtonId =
          buttonElement.id === "tts-button-bebas"
            ? "tts-button-test"
            : "tts-button-bebas";
        const otherButton = document.getElementById(otherButtonId);
        if (otherButton) {
          otherButton.classList.toggle("active", isTtsEnabled);
        }

        if (isTtsEnabled && isFirstTtsClick && synth) {
          console.log(
            "TTS diaktifkan pertama kali, mencoba 'membangunkan' daftar suara..."
          );
          synth.getVoices();
          isFirstTtsClick = false;
        }

        if (!isTtsEnabled && synth.speaking) {
          synth.cancel();
        }
      });
    }

    document.addEventListener("keydown", (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key))
        e.preventDefault();
      switch (e.key) {
        case "ArrowUp":
        case "ArrowDown":
          flipCard();
          break;
        case "ArrowRight":
          learningMode === "bebas" ? nextCard() : handleCorrect();
          break;
        case "ArrowLeft":
          prevCard();
          break;
      }
    });

    if (card) card.addEventListener("click", flipCard);

    if (themeToggle) themeToggle.addEventListener("click", handleThemeToggle);

    // --- INISIALISASI TTS BARU ---
    // Temukan kedua tombol
    const ttsButtonBebas = document.getElementById("tts-button-bebas");
    const ttsButtonTest = document.getElementById("tts-button-test");
    // Inisialisasi listener untuk keduanya
    initializeTtsButton(ttsButtonBebas);
    initializeTtsButton(ttsButtonTest);
    // --- AKHIR INISIALISASI TTS ---

    if (prevButtonSVG) prevButtonSVG.addEventListener("click", prevCard);
    if (nextButtonSVG) nextButtonSVG.addEventListener("click", nextCard);
    if (shuffleButtonBebas)
      shuffleButtonBebas.addEventListener("click", toggleShuffle); // <-- DIUBAH

    if (prevButtonTestSVG)
      prevButtonTestSVG.addEventListener("click", prevCard);
    if (correctButtonSVG)
      correctButtonSVG.addEventListener("click", handleCorrect);
    if (wrongButtonSVG) wrongButtonSVG.addEventListener("click", handleWrong);
    if (shuffleButtonTest)
      shuffleButtonTest.addEventListener("click", toggleShuffle); // <-- DIUBAH

    loadProgress((progresDimuat) => {
      if (!progresDimuat) {
        currentFlashcards = [...originalFlashcards];
        totalCardCount = originalFlashcards.length;

        // DIUBAH: Selalu acak saat sesi baru dimulai, untuk mode bebas dan test
        shuffleArray(currentFlashcards);
        isShuffled = true;
        // Tampilkan status aktif di tombol
        if (shuffleButtonBebas) shuffleButtonBebas.classList.add("active");
        if (shuffleButtonTest) shuffleButtonTest.classList.add("active");
      } else {
        // Progres dimuat, ambil status acak dari progres
        const progress = JSON.parse(localStorage.getItem(storageKey) || "{}");
        totalCardCount = progress.totalCardCount || currentFlashcards.length;
        isShuffled = progress.isShuffled || false; // Ambil status acak
        if (shuffleButtonBebas)
          shuffleButtonBebas.classList.toggle("active", isShuffled);
        if (shuffleButtonTest)
          shuffleButtonTest.classList.toggle("active", isShuffled);
      }

      if (!totalCardCount) {
        totalCardCount = currentFlashcards.length;
      }

      updateCounter();
      showCard(currentCardIndex);
    });
  }
});

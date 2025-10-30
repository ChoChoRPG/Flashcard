document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const babId = urlParams.get("bab");
  const learningMode = urlParams.get("mode") || "bebas";

  if (!babId) {
    document.getElementById("card-front").textContent = "Bab tidak ditemukan.";
    console.error("Parameter 'bab' tidak ada di URL.");
    return;
  }

  const storageKey = `flashcardProgress_bab${babId}_mode${learningMode}`;

  function loadDataScript(callback) {
    const script = document.createElement("script");
    script.src = `../js/Data${babId}.js`;
    script.onload = () => {
      console.log(`Data${babId}.js loaded successfully.`);
      if (typeof dataString !== "undefined") {
        callback();
      } else {
        console.error(
          `dataString tidak ditemukan setelah memuat Data${babId}.js`
        );
        document.getElementById(
          "card-front"
        ).textContent = `Data string kosong di Data${babId}.js`;
      }
    };
    script.onerror = () => {
      console.error(`Failed to load Data${babId}.js.`);
      document.getElementById(
        "card-front"
      ).textContent = `Data untuk Bab ${babId} tidak ditemukan.`;
    };
    document.head.appendChild(script);
  }

  loadDataScript(initializeApp);

  function initializeApp() {
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

    // ================== VARIABEL TTS BARU ==================
    const ttsButton = document.getElementById("tts-button");
    let isTtsEnabled = false;
    const synth = window.speechSynthesis;
    // --- DIHAPUS --- Variabel 'voices' global dihapus untuk mencegah race condition
    // ================== AKHIR VARIABEL TTS =================

    let originalFlashcards = [];
    let currentFlashcards = [];
    let wrongPile = [];
    let currentCardIndex = 0;
    let sessionProgress = 1;
    let correctAnswers = 0;
    let totalCardCount = 0;
    let isFlipped = false;
    let isShuffled = false;

    // ================== FUNGSI TTS BARU ==================

    // --- DIHAPUS --- Fungsi populateVoiceList() dihapus
    // Kita akan mengambil suara langsung di dalam fungsi speak()

    /**
     * Membacakan teks yang diberikan menggunakan suara Jepang.
     * @param {string} text - Teks yang akan dibacakan.
     */
    function speak(text) {
      if (typeof synth === "undefined" || !synth || !text) {
        if (typeof synth === "undefined") {
          console.error("Speech Synthesis API tidak didukung.");
          if (ttsButton) ttsButton.style.display = "none";
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

      // --- PERUBAHAN UTAMA ---
      // Ambil daftar suara SETIAP KALI fungsi speak dipanggil.
      // Ini jauh lebih aman untuk browser mobile yang memuat suara secara asinkron.
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
        // console.log("Using voice:", japaneseVoice.name); // Untuk debug
      } else {
        // Jika tidak ada suara Jepang, setidaknya setel bahasa
        // browser mungkin akan mencoba mencari defaultnya
        utterThis.lang = "ja-JP";
        console.warn(
          "Suara ja-JP tidak ditemukan. Menggunakan default browser (ini mungkin penyebab logat salah)."
        );
      }
      // --- AKHIR PERUBAHAN UTAMA ---

      utterThis.pitch = 1;
      utterThis.rate = 0.8; // Kecepatan normal adalah 1, dibuat sedikit lebih lambat
      synth.speak(utterThis);
    }

    // --- DIHAPUS --- Panggilan ke populateVoiceList() dan onvoiceschanged dihapus

    // ================== AKHIR FUNGSI TTS =================

    if (typeof dataString === "undefined" || dataString.trim() === "") {
      cardFront.textContent = "Data kosong atau tidak valid.";
      return;
    }
    // ... (sisa kode sama persis) ...
    const lines = dataString.trim().split("\n");
    for (const line of lines) {
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

        // --- MODIFIKASI ---
        // Simpan juga definisi mentah dan hiragana untuk TTS
        originalFlashcards.push({
          front,
          back: backHTML,
          hiragana: hiragana,
          definition: definition,
          answered: null,
        });
        // --- AKHIR MODIFIKASI ---
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
        };
        localStorage.setItem(storageKey, JSON.stringify(progress));
      } catch (e) {
        console.error("Gagal menyimpan progres ke localStorage:", e);
      }
    }

    function clearProgress() {
      localStorage.removeItem(storageKey);
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
            if (shuffleButtonBebas)
              shuffleButtonBebas.classList.toggle("active", isShuffled);
            if (shuffleButtonTest)
              shuffleButtonTest.classList.toggle("active", isShuffled);
            onProgressLoaded(true);
          },
          () => {
            clearProgress();
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

    function toggleShuffle() {
      isShuffled = !isShuffled;
      if (shuffleButtonBebas)
        shuffleButtonBebas.classList.toggle("active", isShuffled);
      if (shuffleButtonTest)
        shuffleButtonTest.classList.toggle("active", isShuffled);
      if (isShuffled) {
        shuffleArray(currentFlashcards);
        if (learningMode === "bebas") {
          sessionProgress = 1;
        }
        transitionToCard(0);
      } else {
        currentFlashcards = [...originalFlashcards];
        if (learningMode === "bebas") {
          sessionProgress = 1;
        }
        transitionToCard(0);
      }
      saveProgress();
    }

    /**
     * Membalik kartu dan memicu TTS jika aktif.
     */
    function flipCard() {
      if (currentFlashcards.length === 0) return;

      isFlipped = !isFlipped;
      card.classList.toggle("is-flipped");

      // --- LOGIKA TTS DIMODIFIKASI ---
      if (isFlipped && isTtsEnabled && synth) {
        // Jika kartu dibalik ke belakang DAN TTS aktif
        const cardData = currentFlashcards[currentCardIndex];
        // --- MODIFIKASI: Ganti cardData.definition menjadi cardData.hiragana ---
        if (cardData && cardData.hiragana) {
          // Beri jeda sedikit agar animasi flip terlihat selesai
          setTimeout(() => {
            speak(cardData.hiragana); // Ucapkan teks hiragana
          }, 300); // 300ms
        }
        // --- AKHIR MODIFIKASI ---
      } else if (!isFlipped && synth) {
        // Jika kartu dibalik ke depan, hentikan audio
        synth.cancel();
      }
      // --- AKHIR LOGIKA TTS ---
    }

    /**
     * Transisi ke kartu baru, hentikan TTS yang sedang berjalan.
     */
    function transitionToCard(newIndex) {
      if (appContainer.classList.contains("is-changing")) return;

      // --- LOGIKA TTS BARU ---
      // Hentikan audio yang sedang berjalan sebelum ganti kartu
      if (synth && synth.speaking) {
        synth.cancel();
      }
      // --- AKHIR LOGIKA TTS ---

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

    // Fungsi untuk memicu animasi konfeti
    function triggerConfetti() {
      if (!myConfetti) return;
      myConfetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
      });
      // Hentikan setelah beberapa detik
      setTimeout(() => myConfetti.reset(), 4000);
    }

    function nextCard() {
      if (learningMode !== "bebas" || currentFlashcards.length === 0) return;

      // Cek apakah ini kartu terakhir SEBELUM menambah sessionProgress
      if (sessionProgress >= originalFlashcards.length) {
        triggerConfetti(); // Panggil konfeti
        clearProgress();
        // Tunda sedikit sebelum pindah halaman agar animasi terlihat
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
          // Tunda sedikit sebelum menampilkan modal
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
                if (isShuffled) shuffleArray(currentFlashcards);
                saveProgress();
                transitionToCard(0);
              },
              () => {
                clearProgress();
                window.location.href = "../index.html";
              }
            );
          }, 500); // Tunda 0.5 detik
        } else {
          triggerConfetti(); // Panggil konfeti jika benar semua
          clearProgress();
          // Tunda modal "Selesai"
          setTimeout(() => {
            showModal(
              "Sesi Tes Selesai! Anda Benar Semua.",
              () => {
                window.location.href = "../index.html";
              },
              null
            );
          }, 500); // Tunda 0.5 detik
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
      // Pindahkan checkTestRound() setelah transisi agar tidak terlalu cepat
      // if (checkTestRound()) return;
      transitionToCard(currentCardIndex + 1);
      // Cek setelah transisi dimulai (beri sedikit jeda)
      setTimeout(() => {
        checkTestRound();
      }, 400); // Sesuaikan timing jika perlu
    }

    function handleWrong() {
      if (learningMode !== "test" || currentFlashcards.length === 0) return;
      const cardData = currentFlashcards[currentCardIndex];

      if (cardData.answered === "correct") {
        correctAnswers--;
      }
      cardData.answered = "wrong";

      if (!wrongPile.find((c) => c.front === cardData.front)) {
        wrongPile.push({ ...cardData });
      }

      updateCounter();
      saveProgress();
      // Pindahkan checkTestRound() setelah transisi
      // if (checkTestRound()) return;
      transitionToCard(currentCardIndex + 1);
      // Cek setelah transisi dimulai
      setTimeout(() => {
        checkTestRound();
      }, 400);
    }

    function handleThemeToggle() {
      const isDarkMode = document.body.classList.toggle("dark-mode");
      localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    }

    // --- EVENT LISTENERS ---

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

    if (prevButtonSVG) prevButtonSVG.addEventListener("click", prevCard);
    if (nextButtonSVG) nextButtonSVG.addEventListener("click", nextCard);
    if (shuffleButtonBebas)
      shuffleButtonBebas.addEventListener("click", toggleShuffle);

    if (prevButtonTestSVG)
      prevButtonTestSVG.addEventListener("click", prevCard);
    if (correctButtonSVG)
      correctButtonSVG.addEventListener("click", handleCorrect);
    if (wrongButtonSVG) wrongButtonSVG.addEventListener("click", handleWrong);
    if (shuffleButtonTest)
      shuffleButtonTest.addEventListener("click", toggleShuffle);

    // --- EVENT LISTENER TOMBOL TTS BARU ---
    if (ttsButton) {
      // Cek dukungan sekali di awal
      if (typeof synth === "undefined") {
        ttsButton.style.display = "none";
      }

      ttsButton.addEventListener("click", () => {
        isTtsEnabled = !isTtsEnabled;
        ttsButton.classList.toggle("active", isTtsEnabled);

        // Jika TTS dinonaktifkan, hentikan suara yang sedang diputar
        if (!isTtsEnabled && synth.speaking) {
          synth.cancel();
        }
      });
    }
    // --- AKHIR EVENT LISTENER ---

    loadProgress((progresDimuat) => {
      if (!progresDimuat) {
        currentFlashcards = [...originalFlashcards];
        totalCardCount = originalFlashcards.length;
        if (learningMode === "test" || isShuffled) {
          shuffleArray(currentFlashcards);
        }
      } else {
        const progress = JSON.parse(localStorage.getItem(storageKey) || "{}");
        totalCardCount = progress.totalCardCount || currentFlashcards.length;
      }

      if (!totalCardCount) {
        totalCardCount = currentFlashcards.length;
      }

      updateCounter();
      showCard(currentCardIndex);
    });
  }
});

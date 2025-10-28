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
  // (DIHAPUS) Kunci audio tidak diperlukan lagi
  // const audioEnabledKey = `flashcardAudioEnabled_bab${babId}`;

  function loadDataScript(callback) {
    const script = document.createElement("script");
    script.src = `../js/data_${babId}.js`;
    script.onload = () => {
      console.log(`data_${babId}.js loaded successfully.`);
      callback();
    };
    script.onerror = () => {
      console.error(`Failed to load data_${babId}.js.`);
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
    const themeToggle = document.getElementById("checkbox");
    const cardScene = document.querySelector(".card-scene");

    const prevButtonSVG = document.getElementById("prev-button-svg");
    const nextButtonSVG = document.getElementById("next-button-svg");
    const shuffleButtonBebas = document.getElementById("shuffle-button-bebas");
    // (DIHAPUS) Tombol audio tidak diperlukan lagi
    // const toggleAudioButton = document.getElementById("toggle-audio-btn");

    const prevButtonTestSVG = document.getElementById("prev-button-svg-test");
    const correctButtonSVG = document.getElementById("correct-button-svg");
    const wrongButtonSVG = document.getElementById("wrong-button-svg");
    const shuffleButtonTest = document.getElementById("shuffle-button-test");

    const modal = document.getElementById("custom-modal");
    const modalText = document.getElementById("modal-text");
    const modalButtonYes = document.getElementById("modal-button-yes");
    const modalButtonNo = document.getElementById("modal-button-no");

    let originalFlashcards = [];
    let currentFlashcards = [];
    let wrongPile = [];
    let currentCardIndex = 0;
    let sessionProgress = 1;
    let correctAnswers = 0; // (DIKEMBALIKAN) Logika test mode sebelumnya
    let totalCardCount = 0;
    let isFlipped = false;
    let isShuffled = false;

    // (DIHAPUS) Semua variabel audio tidak diperlukan lagi

    // (DIHAPUS) Fungsi inisialisasi tombol audio

    if (typeof dataString === "undefined" || dataString.trim() === "") {
      cardFront.textContent = "Data kosong atau tidak valid.";
      return;
    }

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
        const back = `<div class="hiragana">${hiragana}</div><div class="definition">${definition}</div><div class="level">${level}</div>`;
        originalFlashcards.push({ front, back, answered: null });
      } catch (e) {
        console.error("Gagal mem-parsing baris:", line, e);
      }
    }
    totalCardCount = originalFlashcards.length; // (DIKEMBALIKAN) Set TCC di sini

    // Fungsi Modal Kustom
    function showModal(text, yesCallback, noCallback) {
      // (DIKEMBALIKAN) Logika modal sebelumnya
      modalText.textContent = text;
      modal.style.display = "flex";

      // (DIKEMBALIKAN) Teks tombol default
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
        // (DIKEMBALIKAN) Logika modal "Selesai"
        modalButtonYes.textContent = "Selesai";
        modalButtonNo.style.display = "none";
      }
    }

    // Fungsi localStorage
    function saveProgress() {
      try {
        const progress = {
          currentFlashcards: currentFlashcards,
          wrongPile: wrongPile,
          currentCardIndex: currentCardIndex,
          sessionProgress: sessionProgress, // Untuk mode bebas
          correctAnswers: correctAnswers, // (DIKEMBALIKAN) Untuk mode test
          totalCardCount: totalCardCount, // Untuk mode test
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
            // YES
            const progress = JSON.parse(savedData);
            currentFlashcards = progress.currentFlashcards;
            wrongPile = progress.wrongPile;
            currentCardIndex = progress.currentCardIndex;
            sessionProgress = progress.sessionProgress;
            correctAnswers = progress.correctAnswers; // (DIKEMBALIKAN)
            totalCardCount =
              progress.totalCardCount || originalFlashcards.length;
            isShuffled = progress.isShuffled;
            shuffleButtonBebas.classList.toggle("active", isShuffled);
            shuffleButtonTest.classList.toggle("active", isShuffled);
            onProgressLoaded(true);
          },
          () => {
            // NO
            clearProgress();
            onProgressLoaded(false);
          }
        );
      } else {
        onProgressLoaded(false);
      }
    }

    // Fungsi Inti Aplikasi
    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    }

    // (DIKEMBALIKAN) Logika counter sebelumnya
    function updateCounter() {
      if (learningMode === "bebas") {
        cardCounter.textContent = `${sessionProgress} / ${originalFlashcards.length}`;
      } else {
        // (DIKEMBALIKAN) Tampilkan progres jawaban benar
        cardCounter.textContent = `${correctAnswers} / ${totalCardCount}`;
      }
    }

    // (DIHAPUS) Fungsi speakText
    // async function speakText(text) { ... }

    // REVISI: showCard (disederhanakan, tanpa audio)
    function showCard(index) {
      if (!currentFlashcards || currentFlashcards.length === 0) return;
      currentCardIndex =
        (index + currentFlashcards.length) % currentFlashcards.length;
      const newCardData = currentFlashcards[currentCardIndex];
      if (!newCardData) return;

      const textToDisplay = newCardData.front;
      cardFront.textContent = textToDisplay;
      cardBack.innerHTML = newCardData.back;
      updateCounter(); // Panggil updateCounter di sini

      // (DIHAPUS) Panggilan speakText
      // speakText(textToDisplay);
    }

    function toggleShuffle() {
      isShuffled = !isShuffled;
      shuffleButtonBebas.classList.toggle("active", isShuffled);
      shuffleButtonTest.classList.toggle("active", isShuffled);
      if (isShuffled) {
        shuffleArray(currentFlashcards);
        transitionToCard(0);
      }
      saveProgress();
    }

    function flipCard() {
      if (currentFlashcards.length > 0) {
        isFlipped = !isFlipped;
        card.classList.toggle("is-flipped");

        // (DIHAPUS) Semua logika audio
      }
    }

    // REVISI: transitionToCard (disederhanakan, tanpa audio)
    function transitionToCard(newIndex) {
      if (appContainer.classList.contains("is-changing")) return;

      const flipFirst = isFlipped;

      // (DIHAPUS) Semua logika audio

      // Fungsi untuk ganti konten kartu
      const changeCardContent = () => {
        appContainer.classList.add("is-changing");
        try {
          setTimeout(() => {
            showCard(newIndex); // Panggil showCard (tanpa audio)
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

    // --- Logika Navigasi BARU ---

    function prevCard() {
      if (currentCardIndex > 0) {
        if (learningMode === "bebas" && sessionProgress > 1) {
          sessionProgress--;
        }
        // (DIKEMBALIKAN) Hanya mode bebas yang bisa 'prev' di logika ini
        // (Logika 'prev' mode test ditangani di listener)
        if (learningMode === "bebas") {
          transitionToCard(currentCardIndex - 1);
          saveProgress();
        } else if (learningMode === "test") {
          // Mode test juga bisa 'prev'
          transitionToCard(currentCardIndex - 1);
          saveProgress();
        }
      }
    }

    function nextCard() {
      if (learningMode !== "bebas" || currentFlashcards.length === 0) return;

      if (sessionProgress >= originalFlashcards.length) {
        clearProgress();
        window.location.href = "../index.html";
      } else {
        sessionProgress++;
        transitionToCard(currentCardIndex + 1);
        saveProgress();
      }
    }

    // (DIKEMBALIKAN) Logika 'checkTestRound'
    function checkTestRound() {
      if (currentCardIndex + 1 >= currentFlashcards.length) {
        if (wrongPile.length > 0) {
          showModal(
            `Putaran selesai. Anda masih salah ${wrongPile.length} kartu. Mulai putaran baru?`,
            () => {
              currentFlashcards = [...wrongPile];
              wrongPile = [];
              currentCardIndex = 0;
              correctAnswers = 0;
              totalCardCount = currentFlashcards.length;
              if (isShuffled) shuffleArray(currentFlashcards);
              saveProgress();
              transitionToCard(0);
            },
            () => {
              window.location.href = "../index.html";
            }
          );
        } else {
          clearProgress();
          showModal(
            "Sesi Tes Selesai! Anda Benar Semua.",
            () => {
              window.location.href = "../index.html";
            },
            null
          ); // (DIKEMBALIKAN) Logika 'null'
        }
        return true;
      }
      return false;
    }

    // (DIKEMBALIKAN) Logika 'handleCorrect' (Mode Test)
    function handleCorrect() {
      if (learningMode !== "test" || currentFlashcards.length === 0) return;

      if (currentFlashcards[currentCardIndex].answered !== "correct") {
        currentFlashcards[currentCardIndex].answered = "correct";
        correctAnswers++;
      }
      saveProgress();
      if (checkTestRound()) return;
      transitionToCard(currentCardIndex + 1);
    }

    // (DIKEMBALIKAN) Logika 'handleWrong' (Mode Test)
    function handleWrong() {
      if (learningMode !== "test" || currentFlashcards.length === 0) return;
      const cardData = currentFlashcards[currentCardIndex]; // Gunakan variabel lokal

      cardData.answered = "wrong";

      if (!wrongPile.find((c) => c.front === cardData.front)) {
        wrongPile.push({ ...cardData });
      }

      if (currentFlashcards[currentCardIndex].answered === "correct") {
        correctAnswers--;
      }

      saveProgress();
      if (checkTestRound()) return;
      transitionToCard(currentCardIndex + 1);
    }

    // Fungsi Tema
    function handleThemeToggle() {
      const isDarkMode = document.body.classList.toggle("dark-mode");
      localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    }

    // (DIHAPUS) Fungsi toggleAudio
    // function toggleAudio() { ... }

    // Event Listeners
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
          prevCard(); // (DIKEMBALIKAN) prevCard dipanggil di sini
          break;
      }
    });

    if (card) card.addEventListener("click", flipCard);
    if (themeToggle) themeToggle.addEventListener("change", handleThemeToggle);

    // Mode Bebas
    if (prevButtonSVG) prevButtonSVG.addEventListener("click", prevCard);
    if (nextButtonSVG) nextButtonSVG.addEventListener("click", nextCard);
    if (shuffleButtonBebas)
      shuffleButtonBebas.addEventListener("click", toggleShuffle);
    // (DIHAPUS) Listener tombol audio
    // if (toggleAudioButton) { ... }

    // Mode Test
    if (prevButtonTestSVG)
      prevButtonTestSVG.addEventListener("click", prevCard); // (DIKEMBALIKAN) Listener 'prev'
    if (correctButtonSVG)
      correctButtonSVG.addEventListener("click", handleCorrect);
    if (wrongButtonSVG) wrongButtonSVG.addEventListener("click", handleWrong);
    if (shuffleButtonTest)
      shuffleButtonTest.addEventListener("click", toggleShuffle);

    // Inisialisasi UI
    if (document.body.classList.contains("dark-mode")) {
      if (themeToggle) themeToggle.checked = true;
    }

    // Muat Progres dan Mulai Aplikasi
    loadProgress((progresDimuat) => {
      if (!progresDimuat) {
        currentFlashcards = [...originalFlashcards];
        totalCardCount = originalFlashcards.length; // (DIKEMBALIKAN)
        if (learningMode === "test" || isShuffled) {
          shuffleArray(currentFlashcards);
        }
      }

      // (DIHAPUS) initializeAudioButton();

      // (DIKEMBALIKAN) Pengecekan TCC
      if (progresDimuat && !totalCardCount) {
        totalCardCount = currentFlashcards.length;
      }

      updateCounter();
      showCard(currentCardIndex);
    });
  }
});

// (DIHAPUS) Semua helper function audio
// function base64ToArrayBuffer(base64) { ... }
// function pcmToWav(pcmData, sampleRate, numChannels) { ... }

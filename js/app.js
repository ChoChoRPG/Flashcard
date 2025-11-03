document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const babIdsParam = urlParams.get("bab");
  const learningMode = urlParams.get("mode") || "bebas";

  const babIds = babIdsParam ? babIdsParam.split(",").filter(Boolean) : [];

  if (!babIds || babIds.length === 0) {
    document.getElementById("card-front").textContent = "Bab tidak ditemukan.";
    return;
  }

  const sortedBabKey = babIds.sort().join("_");
  const storageKey = `flashcardProgress_babs${sortedBabKey}_mode${learningMode}`;

  async function loadSingleDataScript(babId) {
    try {
      const response = await fetch(`../js/Data${babId}.js`);
      if (!response.ok) {
        throw new Error(
          `Gagal memuat Data${babId}.js (status: ${response.status})`
        );
      }
      const scriptText = await response.text();

      if (!scriptText || scriptText.trim() === "") {
        return "";
      }

      const data = new Function(
        scriptText +
          '; return typeof dataString !== "undefined" ? dataString : undefined;'
      )();

      if (typeof data !== "undefined") {
        return data;
      } else {
        throw new Error(
          `dataString tidak terdefinisi di dalam Data${babId}.js`
        );
      }
    } catch (error) {
      throw new Error(`Gagal memproses Data${babId}.js: ${error.message}`);
    }
  }

  async function loadAllDataScripts(
    babIds,
    onCompleteCallback,
    onErrorCallback
  ) {
    try {
      const allPromises = babIds.map((babId) => loadSingleDataScript(babId));
      const allDataStrings = await Promise.all(allPromises);
      onCompleteCallback(allDataStrings.join("\n"));
    } catch (error) {
      // <-- Kurung kurawal yang hilang sudah ditambahkan di sini
      onErrorCallback(error);
    }
  }

  loadAllDataScripts(
    babIds,
    (combinedData) => {
      window.dataString = combinedData;
      initializeApp();
    },
    (error) => {
      console.error(error);
      document.getElementById("card-front").textContent = error.message;
    }
  );

  function initializeApp() {
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

    const confettiCanvas = document.getElementById("confetti-canvas");
    const myConfetti = confettiCanvas
      ? confetti.create(confettiCanvas, { resize: true })
      : null;

    let isTtsEnabled = false;
    const synth = window.speechSynthesis;
    let isFirstTtsClick = true;

    let originalFlashcards = [];
    let currentFlashcards = [];
    let wrongPile = [];
    let wrongAnswerLog = {};
    let currentCardIndex = 0;
    let sessionProgress = 1;
    let correctAnswers = 0;
    let totalCardCount = 0;
    let isFlipped = false;
    let isShuffled = false;

    function speak(text) {
      if (typeof synth === "undefined" || !synth || !text) {
        if (typeof synth === "undefined") {
          const ttsBtnBebas = document.getElementById("tts-button-bebas");
          const ttsBtnTest = document.getElementById("tts-button-test");
          if (ttsBtnBebas) ttsBtnBebas.style.display = "none";
          if (ttsBtnTest) ttsBtnTest.style.display = "none";
        }
        return;
      }

      if (synth.speaking) {
        synth.cancel();
      }

      const utterThis = new SpeechSynthesisUtterance(text);
      utterThis.onerror = (e) => {
        console.error("SpeechSynthesisUtterance.onerror", e);
      };

      const allVoices = synth.getVoices();
      let japaneseVoice = allVoices.find((voice) => voice.lang === "ja-JP");
      if (!japaneseVoice) {
        japaneseVoice = allVoices.find((voice) => voice.lang.startsWith("ja"));
      }

      if (japaneseVoice) {
        utterThis.voice = japaneseVoice;
      } else {
        utterThis.lang = "ja-JP";
      }

      utterThis.pitch = 1;
      utterThis.rate = 0.8;
      synth.speak(utterThis);
    }

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

        originalFlashcards.push({
          front,
          back: backHTML,
          hiragana: hiragana,
          definition: definition,
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

    function showTestRecap(log) {
      const appContainer = document.getElementById("app");
      const recapContainer = document.getElementById("recap-container");
      const recapTableBody = document.getElementById("recap-table-body");
      const headerControls = document.querySelector(".header-controls");

      const logEntries = Object.values(log);

      if (logEntries.length === 0) {
        showModal(
          "Sesi Tes Selesai! Anda Benar Semua.",
          () => {
            window.location.href = "../index.html";
          },
          null
        );
        return;
      }

      if (appContainer) appContainer.style.display = "none";
      if (headerControls) headerControls.style.display = "none";

      logEntries.sort((a, b) => b.count - a.count);
      recapTableBody.innerHTML = "";

      logEntries.forEach((entry, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${entry.card.front || "-"}</td>
          <td>${entry.card.hiragana || "-"}</td>
          <td>${entry.card.definition || "-"}</td>
          <td>${entry.count}</td>
        `;
        recapTableBody.appendChild(row);
      });

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
          wrongAnswerLog: wrongAnswerLog,
        };
        localStorage.setItem(storageKey, JSON.stringify(progress));
      } catch (e) {
        console.error("Gagal menyimpan progres ke localStorage:", e);
      }
    }

    function clearProgress() {
      localStorage.removeItem(storageKey);
      wrongAnswerLog = {};
    }

    function loadProgress(onProgressLoaded) {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        showModal(
          "Ditemukan sesi terakhir yang belum selesai. Lanjutkan?",
          () => {
            let progress;
            try {
              progress = JSON.parse(savedData);
            } catch (e) {
              clearProgress();
              onProgressLoaded(false);
              return;
            }

            if (
              !progress ||
              !progress.currentFlashcards ||
              progress.currentFlashcards.length === 0
            ) {
              clearProgress();
              onProgressLoaded(false);
              return;
            }

            currentFlashcards = progress.currentFlashcards;
            wrongPile = progress.wrongPile;
            currentCardIndex = progress.currentCardIndex;
            sessionProgress = progress.sessionProgress;
            correctAnswers = progress.correctAnswers;
            totalCardCount =
              progress.totalCardCount || originalFlashcards.length;
            isShuffled = progress.isShuffled;
            wrongAnswerLog = progress.wrongAnswerLog || {};
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

      const seenCards = currentFlashcards.slice(0, currentCardIndex + 1);
      let remainingCards = currentFlashcards.slice(currentCardIndex + 1);

      if (remainingCards.length < 2) {
        saveProgress();
        return;
      }

      if (isShuffled) {
        shuffleArray(remainingCards);
        currentFlashcards = seenCards.concat(remainingCards);

        if (cardScene) {
          cardScene.style.transform = "scale(1.05)";
          setTimeout(() => {
            cardScene.style.transform = "scale(1)";
          }, 150);
        }
      } else {
        if (!window.originalOrderMap) {
          window.originalOrderMap = new Map();
          originalFlashcards.forEach((card, index) => {
            window.originalOrderMap.set(card.front, index);
          });
        }

        remainingCards.sort((a, b) => {
          const orderA = window.originalOrderMap.get(a.front);
          const orderB = window.originalOrderMap.get(b.front);
          return orderA - orderB;
        });

        currentFlashcards = seenCards.concat(remainingCards);

        if (cardScene) {
          cardScene.style.transform = "scale(0.95)";
          setTimeout(() => {
            cardScene.style.transform = "scale(1)";
          }, 150);
        }
      }
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
      if (currentCardIndex >= currentFlashcards.length - 1) {
        const finalLog = JSON.parse(JSON.stringify(wrongAnswerLog));

        setTimeout(() => {
          if (wrongPile.length > 0) {
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
                showTestRecap(finalLog);
              }
            );
          } else {
            triggerConfetti();
            clearProgress();
            showTestRecap(finalLog);
          }
        }, 500);

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

      const isRoundOver = checkTestRound();

      if (!isRoundOver) {
        transitionToCard(currentCardIndex + 1);
      }
    }

    function handleWrong() {
      if (learningMode !== "test" || currentFlashcards.length === 0) return;
      const cardData = currentFlashcards[currentCardIndex];

      const cardId = cardData.front;
      const currentCount = wrongAnswerLog[cardId]?.count || 0;
      wrongAnswerLog[cardId] = {
        count: currentCount + 1,
        card: { ...cardData },
      };

      if (cardData.answered === "correct") {
        correctAnswers--;
      }
      cardData.answered = "wrong";

      if (!wrongPile.find((c) => c.front === cardData.front)) {
        wrongPile.push({ ...cardData });
      }

      updateCounter();
      saveProgress();

      const isRoundOver = checkTestRound();

      if (!isRoundOver) {
        transitionToCard(currentCardIndex + 1);
      }
    }

    function handleBypass() {
      if (learningMode === "bebas") {
        nextCard();
      } else if (learningMode === "test") {
        const isRoundOver = checkTestRound();

        if (!isRoundOver) {
          transitionToCard(currentCardIndex + 1);
        }
      }
    }

    function handleThemeToggle() {
      const isDarkMode = document.body.classList.toggle("dark-mode");
      localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    }

    function initializeTtsButton(buttonElement) {
      if (!buttonElement) return;

      if (typeof synth === "undefined") {
        buttonElement.style.display = "none";
        return;
      }

      buttonElement.classList.toggle("active", isTtsEnabled);

      buttonElement.addEventListener("click", () => {
        isTtsEnabled = !isTtsEnabled;
        buttonElement.classList.toggle("active", isTtsEnabled);

        const otherButtonId =
          buttonElement.id === "tts-button-bebas"
            ? "tts-button-test"
            : "tts-button-bebas";
        const otherButton = document.getElementById(otherButtonId);
        if (otherButton) {
          otherButton.classList.toggle("active", isTtsEnabled);
        }

        if (isTtsEnabled && isFirstTtsClick && synth) {
          synth.getVoices();
          isFirstTtsClick = false;
        }

        if (!isTtsEnabled && synth.speaking) {
          synth.cancel();
        }
      });
    }

    document.addEventListener("keydown", (e) => {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "="].includes(e.key)
      )
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
        case "=":
          handleBypass();
          break;
      }
    });

    if (card) card.addEventListener("click", flipCard);
    if (themeToggle) themeToggle.addEventListener("click", handleThemeToggle);

    const ttsButtonBebas = document.getElementById("tts-button-bebas");
    const ttsButtonTest = document.getElementById("tts-button-test");
    initializeTtsButton(ttsButtonBebas);
    initializeTtsButton(ttsButtonTest);

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

    loadProgress((progresDimuat) => {
      if (!progresDimuat) {
        currentFlashcards = [...originalFlashcards];
        totalCardCount = originalFlashcards.length;

        shuffleArray(currentFlashcards);
        isShuffled = true;
        if (shuffleButtonBebas) shuffleButtonBebas.classList.add("active");
        if (shuffleButtonTest) shuffleButtonTest.classList.add("active");
      } else {
        const progress = JSON.parse(localStorage.getItem(storageKey) || "{}");
        totalCardCount = progress.totalCardCount || currentFlashcards.length;
        isShuffled = progress.isShuffled || false;
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

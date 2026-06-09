(function () {
  const POSITIONS = ["PG", "SG", "SF", "PF", "C"];
  const ERAS = ["1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"];
  const MAX_ROUNDS = 5;
  const RENTAL_BUDGET = 20;

  const TEAM_CN = {
    ATL: "老鹰", BKN: "篮网", BOS: "凯尔特人", CHA: "黄蜂", CHI: "公牛",
    CLE: "骑士", DAL: "独行侠", DEN: "掘金", DET: "活塞", GSW: "勇士",
    HOU: "火箭", IND: "步行者", LAC: "快船", LAL: "湖人", MEM: "灰熊",
    MIA: "热火", MIL: "雄鹿", MIN: "森林狼", NOP: "鹈鹕", NYK: "尼克斯",
    OKC: "雷霆", ORL: "魔术", PHI: "76人", PHX: "太阳", POR: "开拓者",
    SAC: "国王", SAS: "马刺", TOR: "猛龙", UTA: "爵士", WAS: "奇才"
  };

  const TEAM_COLORS = {
    ATL: ["#b42b33", "#c76169"], BKN: ["#c6c6c6", "#505050"], BOS: ["#17864c", "#0c3622"],
    CHA: ["#2b2874", "#30b7c4"], CHI: ["#d93831", "#141414"], CLE: ["#860038", "#bc945c"],
    DAL: ["#2d6ab7", "#c5cdd4"], DEN: ["#418fde", "#f6c85f"], DET: ["#c42e47", "#254f9d"],
    GSW: ["#eeba4b", "#283f85"], HOU: ["#ad342c", "#ffffff"], IND: ["#eac962", "#142356"],
    LAC: ["#002650", "#c93a4a"], LAL: ["#f1bc4b", "#50247c"], MEM: ["#5d75ad", "#14163b"],
    MIA: ["#a32a2e", "#261c22"], MIL: ["#dcd4b4", "#304c38"], MIN: ["#b6c8d3", "#244f7d"],
    NOP: ["#ae9b6d", "#1b2b47"], NYK: ["#d86a34", "#1c399f"], OKC: ["#4876b6", "#ef7b31"],
    ORL: ["#3053ad", "#111111"], PHI: ["#3063b0", "#d64242"], PHX: ["#f6ca57", "#6c3592"],
    POR: ["#ab2f32", "#161616"], SAC: ["#55277f", "#c7c7c7"], SAS: ["#c7cdd4", "#34393d"],
    TOR: ["#b12a32", "#111111"], UTA: ["#15203e", "#f4c542"], WAS: ["#16213d", "#bd2a33"]
  };

  const ERA_BENCHMARKS = {
    "1960s": { pts: 30, reb: 18, ast: 8, stl: 1.8, blk: 1.8 },
    "1970s": { pts: 28, reb: 13, ast: 9, stl: 2, blk: 2 },
    "1980s": { pts: 28, reb: 11, ast: 11, stl: 2.2, blk: 2 },
    "1990s": { pts: 27, reb: 11, ast: 9, stl: 2, blk: 2 },
    "2000s": { pts: 27, reb: 11, ast: 9, stl: 2, blk: 2 },
    "2010s": { pts: 28, reb: 11, ast: 9, stl: 1.8, blk: 1.8 },
    "2020s": { pts: 28, reb: 11, ast: 9, stl: 1.8, blk: 1.8 }
  };

  const POSITION_WEIGHTS = {
    PG: { pts: 0.4, reb: 0.1, ast: 0.35, stl: 0.1, blk: 0.05 },
    SG: { pts: 0.45, reb: 0.1, ast: 0.2, stl: 0.2, blk: 0.05 },
    SF: { pts: 0.45, reb: 0.15, ast: 0.2, stl: 0.15, blk: 0.05 },
    PF: { pts: 0.4, reb: 0.3, ast: 0.1, stl: 0.1, blk: 0.1 },
    C: { pts: 0.4, reb: 0.35, ast: 0.1, stl: 0.05, blk: 0.1 }
  };

  const GRADE_BANDS = [
    { min: 80, grade: "S", label: "完美赛季", color: "#f6c85f", verdict: "几乎没有短板，攻防和位置适配都到顶了。" },
    { min: 72, grade: "A+", label: "历史级强队", color: "#2cc7a6", verdict: "这支队放进任何时代都足够争冠。" },
    { min: 62, grade: "A", label: "王朝球队", color: "#2cc7a6", verdict: "核心强度很高，只差一点极致均衡。" },
    { min: 55, grade: "B", label: "争冠队", color: "#3e8ed0", verdict: "上限很硬，但某个位置还有被针对的空间。" },
    { min: 48, grade: "C", label: "季后赛队", color: "#f6c85f", verdict: "能赢不少球，但离完美赛季还有明显距离。" },
    { min: 38, grade: "D", label: "乐透边缘", color: "#c85d2d", verdict: "有球星火力，阵容平衡和防守覆盖不够。" },
    { min: 0, grade: "F", label: "摆烂大军", color: "#db4a3f", verdict: "这阵容更像在争状元签。" }
  ];

  const FRIEND_COMBO_KEYS = new Set([
    "2010s|BKN",
    "2000s|LAL",
    "2000s|HOU",
    "2020s|MIA",
    "2000s|DAL",
    "2000s|ORL"
  ]);

  const dataByCombo = new Map();
  const comboMeta = new Map();
  const combos = [];
  const usedNames = new Set();
  let currentFilter = "all";
  let pendingPick = null;
  let selectedMode = "classic";

  const state = {
    mode: "classic",
    round: 0,
    slots: {},
    currentTeam: null,
    currentEra: null,
    usedCombos: new Set(),
    skipTeam: 1,
    skipEra: 1,
    budget: RENTAL_BUDGET,
    rentalOffers: [],
    result: null
  };

  const els = {
    startBtn: document.getElementById("startBtn"),
    rulesBtn: document.getElementById("rulesBtn"),
    modeButtons: document.querySelectorAll(".mode-card"),
    homeBtn: document.getElementById("homeBtn"),
    restartBtn: document.getElementById("restartBtn"),
    spinBtn: document.getElementById("spinBtn"),
    skipTeamBtn: document.getElementById("skipTeamBtn"),
    skipEraBtn: document.getElementById("skipEraBtn"),
    againBtn: document.getElementById("againBtn"),
    resultHomeBtn: document.getElementById("resultHomeBtn"),
    posterBtn: document.getElementById("posterBtn"),
    closePosterBtn: document.getElementById("closePosterBtn"),
    downloadPosterBtn: document.getElementById("downloadPosterBtn"),
    roundNow: document.getElementById("roundNow"),
    budgetChip: document.getElementById("budgetChip"),
    budgetText: document.getElementById("budgetText"),
    rosterBoard: document.getElementById("rosterBoard"),
    playerList: document.getElementById("playerList"),
    draftArea: document.getElementById("draftArea"),
    draftTitle: document.getElementById("draftTitle"),
    draftHint: document.getElementById("draftHint"),
    rentalMarket: document.getElementById("rentalMarket"),
    offerList: document.getElementById("offerList"),
    marketHint: document.getElementById("marketHint"),
    teamReel: document.getElementById("teamReel"),
    eraReel: document.getElementById("eraReel"),
    teamText: document.getElementById("teamText"),
    eraText: document.getElementById("eraText"),
    skipTeamCount: document.getElementById("skipTeamCount"),
    skipEraCount: document.getElementById("skipEraCount"),
    recordText: document.getElementById("recordText"),
    gradeText: document.getElementById("gradeText"),
    tierText: document.getElementById("tierText"),
    meterFill: document.getElementById("meterFill"),
    verdictText: document.getElementById("verdictText"),
    resultRoster: document.getElementById("resultRoster"),
    rulesDialog: document.getElementById("rulesDialog"),
    posterOverlay: document.getElementById("posterOverlay"),
    posterCanvas: document.getElementById("posterCanvas")
  };

  function initData() {
    NBA_PLAYERS.forEach((player) => {
      const key = comboKey(player.era, player.team);
      if (!dataByCombo.has(key)) {
        dataByCombo.set(key, []);
        combos.push({ era: player.era, team: player.team });
      }
      dataByCombo.get(key).push(player);
    });

    dataByCombo.forEach((players) => {
      players.sort((a, b) => playerSortScore(b) - playerSortScore(a));
    });

    const strengthRows = combos.map((combo) => ({ ...combo, strength: comboStrength(combo) }));
    const strengths = strengthRows.map((row) => row.strength);
    const min = Math.min(...strengths);
    const max = Math.max(...strengths);
    strengthRows.forEach((row) => {
      const normalized = max === min ? 0.5 : (row.strength - min) / (max - min);
      const price = Math.max(1, Math.min(8, 1 + Math.round(normalized * 7)));
      comboMeta.set(comboKey(row.era, row.team), {
        strength: row.strength,
        price,
        label: price >= 7 ? "豪门溢价" : price >= 5 ? "争冠拼图" : price >= 3 ? "均衡报价" : "淘宝价"
      });
    });
  }

  function comboKey(era, team) {
    return `${era}|${team}`;
  }

  function isFriendCombo(combo) {
    return FRIEND_COMBO_KEYS.has(comboKey(combo.era, combo.team));
  }

  function teamName(team) {
    return TEAM_CN[team] || team;
  }

  function playerSortScore(player) {
    return player.pts + player.reb + player.ast + (player.stl || 0) * 2 + (player.blk || 0) * 2;
  }

  function comboStrength(combo) {
    const players = dataByCombo.get(comboKey(combo.era, combo.team)) || [];
    const top = players.slice(0, 10);
    if (!top.length) return 0;
    const topAverage = top.reduce((sum, player) => sum + playerSortScore(player), 0) / top.length;
    const starPower = top.slice(0, 3).reduce((sum, player) => sum + playerSortScore(player), 0) / Math.min(3, top.length);
    const covered = new Set(top.flatMap((player) => player.positions));
    return topAverage * 0.62 + starPower * 0.34 + covered.size * 1.7;
  }

  function showScreen(id) {
    document.querySelectorAll(".screen").forEach((screen) => {
      screen.classList.toggle("active", screen.id === id);
    });
  }

  function resetGame() {
    state.mode = selectedMode;
    state.round = 0;
    state.slots = {};
    state.currentTeam = null;
    state.currentEra = null;
    state.usedCombos = new Set();
    state.skipTeam = 1;
    state.skipEra = 1;
    state.budget = RENTAL_BUDGET;
    state.rentalOffers = [];
    state.result = null;
    usedNames.clear();
    pendingPick = null;
    currentFilter = "all";
    showScreen("screen-game");
    nextRound();
  }

  function returnHome() {
    state.round = 0;
    state.slots = {};
    state.currentTeam = null;
    state.currentEra = null;
    state.usedCombos = new Set();
    state.skipTeam = 1;
    state.skipEra = 1;
    state.budget = RENTAL_BUDGET;
    state.rentalOffers = [];
    state.result = null;
    usedNames.clear();
    pendingPick = null;
    currentFilter = "all";
    els.draftArea.hidden = true;
    els.rentalMarket.hidden = true;
    els.offerList.innerHTML = "";
    els.posterOverlay.hidden = true;
    showScreen("screen-menu");
  }

  function nextRound() {
    if (state.round >= MAX_ROUNDS) {
      finishSeason();
      return;
    }
    state.currentTeam = null;
    state.currentEra = null;
    state.rentalOffers = [];
    pendingPick = null;
    currentFilter = "all";
    els.roundNow.textContent = String(state.round + 1);
    els.teamText.textContent = state.mode === "rental" ? "市场" : "???";
    els.eraText.textContent = state.mode === "rental" ? `$${state.budget}` : "???";
    els.teamReel.classList.remove("spinning");
    els.eraReel.classList.remove("spinning");
    els.spinBtn.disabled = false;
    els.spinBtn.textContent = state.mode === "rental" ? "刷新租队市场" : "抽取组合";
    els.skipTeamBtn.disabled = true;
    els.skipEraBtn.disabled = true;
    els.skipTeamBtn.hidden = state.mode === "rental";
    els.skipEraBtn.hidden = state.mode === "rental";
    els.budgetChip.hidden = state.mode !== "rental";
    els.rentalMarket.hidden = true;
    els.offerList.innerHTML = "";
    els.draftArea.hidden = true;
    renderRoster();
    updateSkipCounts();
  }

  function renderRoster() {
    els.rosterBoard.innerHTML = "";
    POSITIONS.forEach((pos) => {
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = "position-slot";
      slot.dataset.pos = pos;
      const player = state.slots[pos];

      if (player) {
        slot.classList.add("filled");
        applyTeamColors(slot, player.team);
        slot.innerHTML = `<strong></strong><small></small>`;
        slot.querySelector("strong").textContent = player.name;
        slot.querySelector("small").textContent = `${pos} · ${teamName(player.team)} · ${player.era}`;
      } else if (pendingPick && pendingPick.positions.includes(pos)) {
        slot.classList.add("target");
        slot.innerHTML = `<strong>${pos}</strong><small>可放入</small>`;
      } else {
        slot.innerHTML = `<strong>${pos}</strong><small>待选择</small>`;
      }

      slot.addEventListener("click", () => placePending(pos));
      els.rosterBoard.appendChild(slot);
    });
  }

  function applyTeamColors(element, team) {
    const [a, b] = TEAM_COLORS[team] || ["#2d333b", "#555"];
    element.style.background = `linear-gradient(135deg, ${a}, ${b})`;
    element.style.borderColor = a;
    element.style.boxShadow = `0 0 18px ${a}55`;
  }

  function updateSkipCounts() {
    els.skipTeamCount.textContent = String(state.skipTeam);
    els.skipEraCount.textContent = String(state.skipEra);
    els.budgetText.textContent = `$${state.budget}`;
  }

  function spinCombo() {
    if (els.spinBtn.disabled) return;
    if (state.mode === "rental") {
      openRentalMarket();
      return;
    }
    pendingPick = null;
    els.draftArea.hidden = true;
    els.spinBtn.disabled = true;
    els.skipTeamBtn.disabled = true;
    els.skipEraBtn.disabled = true;
    els.teamReel.classList.add("spinning");
    els.eraReel.classList.add("spinning");

    let ticks = 0;
    const interval = window.setInterval(() => {
      const random = combos[Math.floor(Math.random() * combos.length)];
      els.teamText.textContent = teamName(random.team);
      els.eraText.textContent = random.era;
      ticks += 1;
      if (ticks >= 22) {
        window.clearInterval(interval);
        const combo = pickUnusedCombo();
        setCurrentCombo(combo);
        showDraftPool();
      }
    }, 58);
  }

  function openRentalMarket() {
    pendingPick = null;
    els.draftArea.hidden = true;
    els.rentalMarket.hidden = true;
    els.spinBtn.disabled = true;
    els.teamReel.classList.add("spinning");
    els.eraReel.classList.add("spinning");

    let ticks = 0;
    const interval = window.setInterval(() => {
      const random = combos[Math.floor(Math.random() * combos.length)];
      const meta = comboMeta.get(comboKey(random.era, random.team));
      els.teamText.textContent = teamName(random.team);
      els.eraText.textContent = `$${meta?.price || 1}`;
      ticks += 1;
      if (ticks >= 18) {
        window.clearInterval(interval);
        els.teamReel.classList.remove("spinning");
        els.eraReel.classList.remove("spinning");
        state.rentalOffers = generateRentalOffers();
        renderRentalMarket();
      }
    }, 58);
  }

  function generateRentalOffers() {
    const remainingPicks = MAX_ROUNDS - state.round;
    const maxPrice = Math.max(1, state.budget - (remainingPicks - 1));
    const candidatePool = combos
      .filter((combo) => !state.usedCombos.has(comboKey(combo.era, combo.team)))
      .map((combo) => ({ ...combo, ...comboMeta.get(comboKey(combo.era, combo.team)) }))
      .filter((offer) => hasDraftablePlayer(offer));
    const fallbackPool = combos
      .filter((combo) => !state.usedCombos.has(comboKey(combo.era, combo.team)))
      .map((combo) => ({ ...combo, ...comboMeta.get(comboKey(combo.era, combo.team)) }));
    const sourcePool = candidatePool.length ? candidatePool : fallbackPool;
    const available = sourcePool.filter((offer) => offer.price <= maxPrice);

    const selected = [];
    const pushOffer = (offer) => {
      if (!offer) return false;
      if (selected.some((item) => comboKey(item.era, item.team) === comboKey(offer.era, offer.team))) return false;
      selected.push(offer);
      return true;
    };
    const addRandom = (pool) => {
      const filtered = pool.filter((offer) => !selected.some((item) => comboKey(item.era, item.team) === comboKey(offer.era, offer.team)));
      if (!filtered.length) return;
      pushOffer(filtered[Math.floor(Math.random() * filtered.length)]);
    };

    addRandom(available.filter((offer) => offer.price <= Math.min(2, maxPrice)));
    addRandom(available.filter((offer) => offer.price >= 3 && offer.price <= Math.min(5, maxPrice)));
    addRandom(available.filter((offer) => offer.price >= Math.max(1, maxPrice - 2) && offer.price <= maxPrice));

    if (!selected.some(isFriendCombo)) {
      const friendOffer = sourcePool
        .filter((offer) => isFriendCombo(offer))
        .sort((a, b) => a.price - b.price || b.strength - a.strength)[0];
      if (friendOffer) {
        pushOffer(friendOffer.price <= maxPrice ? friendOffer : {
          ...friendOffer,
          originalPrice: friendOffer.price,
          price: maxPrice,
          label: "好友特邀"
        });
      }
    }

    const shuffledAvailable = [...available].sort(() => Math.random() - 0.5);
    for (const offer of shuffledAvailable) {
      if (selected.length >= 3) break;
      pushOffer(offer);
    }

    const clearancePool = sourcePool
      .filter((offer) => offer.price > maxPrice)
      .sort((a, b) => a.price - b.price || a.strength - b.strength);
    while (selected.length < 3 && clearancePool.length) {
      const offer = clearancePool.shift();
      pushOffer({
        ...offer,
        originalPrice: offer.price,
        price: maxPrice,
        label: "预算清仓"
      });
    }

    return selected.sort((a, b) => a.price - b.price);
  }

  function hasDraftablePlayer(combo) {
    const openPositions = POSITIONS.filter((pos) => !state.slots[pos]);
    if (!openPositions.length) return false;
    const players = dataByCombo.get(comboKey(combo.era, combo.team)) || [];
    return players
      .filter((player) => !usedNames.has(player.name))
      .some((player) => player.positions.some((pos) => openPositions.includes(pos)));
  }

  function renderRentalMarket() {
    const remainingPicks = MAX_ROUNDS - state.round;
    const maxPrice = Math.max(1, state.budget - (remainingPicks - 1));
    els.teamText.textContent = "报价";
    els.eraText.textContent = `$${state.budget}`;
    els.marketHint.textContent = `剩余 ${remainingPicks} 轮，当前最多可花 $${maxPrice}，否则后面预算不够。`;
    els.offerList.innerHTML = "";

    state.rentalOffers.forEach((offer) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "rental-offer";
      button.innerHTML = `
        <strong></strong>
        <span class="price"></span>
        <span class="meta"></span>
        <span class="note"></span>
      `;
      button.querySelector("strong").textContent = `${teamName(offer.team)} · ${offer.era}`;
      button.querySelector(".price").textContent = `$${offer.price}`;
      const original = offer.originalPrice ? ` · 原价 $${offer.originalPrice}` : "";
      button.querySelector(".meta").textContent = `人才池强度 ${offer.strength.toFixed(1)} · ${offer.label}${original}`;
      button.querySelector(".note").textContent = rentalNote(offer.price, maxPrice);
      button.addEventListener("click", () => rentOffer(offer));
      els.offerList.appendChild(button);
    });

    els.rentalMarket.hidden = false;
  }

  function rentalNote(price, maxPrice) {
    if (price === 1 && maxPrice === 1) return "底薪补位报价，保证最后一轮还能继续选。";
    if (price >= maxPrice && maxPrice > 1) return "压线报价，选了就要靠后面淘便宜货。";
    if (price >= 7) return "明星很多，但会吃掉大块预算。";
    if (price <= 2) return "便宜好下手，能不能淘到位置答案看眼光。";
    return "价格适中，适合补一个稳定位置。";
  }

  function rentOffer(offer) {
    if (offer.price > state.budget) return;
    if (state.usedCombos.has(comboKey(offer.era, offer.team))) return;
    state.budget -= offer.price;
    updateSkipCounts();
    setCurrentCombo(offer);
    state.rentalOffers = [];
    els.offerList.innerHTML = "";
    els.rentalMarket.hidden = true;
    showDraftPool();
  }

  function pickUnusedCombo(filter) {
    const available = combos.filter((combo) => {
      if (filter && !filter(combo)) return false;
      return !state.usedCombos.has(comboKey(combo.era, combo.team));
    });
    const friendAvailable = available.filter(isFriendCombo);
    if (!filter && friendAvailable.length) {
      return friendAvailable[Math.floor(Math.random() * friendAvailable.length)];
    }
    const pool = available.length ? available : combos.filter((combo) => !filter || filter(combo));
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function setCurrentCombo(combo) {
    state.currentTeam = combo.team;
    state.currentEra = combo.era;
    state.usedCombos.add(comboKey(combo.era, combo.team));
    els.teamText.textContent = teamName(combo.team);
    els.eraText.textContent = combo.era;
    els.teamReel.classList.remove("spinning");
    els.eraReel.classList.remove("spinning");
    els.skipTeamBtn.disabled = state.mode === "rental" || state.skipTeam <= 0;
    els.skipEraBtn.disabled = state.mode === "rental" || state.skipEra <= 0;
    updateSkipCounts();
  }

  function skipTeam() {
    if (state.skipTeam <= 0 || !state.currentEra) return;
    state.skipTeam -= 1;
    animateSingleReel(els.teamReel, () => {
      const combo = pickUnusedCombo((item) => item.era === state.currentEra && item.team !== state.currentTeam);
      setCurrentCombo(combo || { era: state.currentEra, team: state.currentTeam });
      showDraftPool();
    });
  }

  function skipEra() {
    if (state.skipEra <= 0 || !state.currentTeam) return;
    state.skipEra -= 1;
    animateSingleReel(els.eraReel, () => {
      const combo = pickUnusedCombo((item) => item.team === state.currentTeam && item.era !== state.currentEra);
      setCurrentCombo(combo || { era: state.currentEra, team: state.currentTeam });
      showDraftPool();
    });
  }

  function animateSingleReel(reel, done) {
    els.skipTeamBtn.disabled = true;
    els.skipEraBtn.disabled = true;
    reel.classList.add("spinning");
    let ticks = 0;
    const interval = window.setInterval(() => {
      const random = combos[Math.floor(Math.random() * combos.length)];
      if (reel === els.teamReel) els.teamText.textContent = teamName(random.team);
      if (reel === els.eraReel) els.eraText.textContent = random.era;
      ticks += 1;
      if (ticks >= 16) {
        window.clearInterval(interval);
        reel.classList.remove("spinning");
        done();
      }
    }, 62);
  }

  function showDraftPool() {
    currentFilter = "all";
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.filter === "all");
    });
    els.rentalMarket.hidden = true;
    els.draftArea.hidden = false;
    els.draftTitle.textContent = `${teamName(state.currentTeam)} · ${state.currentEra}`;
    els.draftHint.textContent = "点击球员后，再点击上方高亮位置。";
    renderPlayers();
  }

  function renderPlayers() {
    const players = getVisiblePlayers();
    els.playerList.innerHTML = "";
    if (!players.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "当前筛选下没有可用球员。";
      els.playerList.appendChild(empty);
      return;
    }

    players.forEach((player) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "player-card";
      if (pendingPick && pendingPick.id === player.id) card.classList.add("selected");

      const name = document.createElement("div");
      name.className = "name";
      name.textContent = player.name;

      const badges = document.createElement("div");
      badges.className = "badges";
      player.positions.forEach((pos) => {
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = pos;
        badges.appendChild(badge);
      });

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = `${teamName(player.team)} · ${player.era}`;

      const stats = document.createElement("div");
      stats.className = "stats";
      stats.textContent = `PTS ${fmt(player.pts)} · REB ${fmt(player.reb)} · AST ${fmt(player.ast)} · STL ${fmt(player.stl)} · BLK ${fmt(player.blk)}`;

      card.append(name, badges, meta, stats);
      card.addEventListener("click", () => selectPlayer(player));
      els.playerList.appendChild(card);
    });
  }

  function getVisiblePlayers() {
    const key = comboKey(state.currentEra, state.currentTeam);
    let players = (dataByCombo.get(key) || []).filter((player) => !usedNames.has(player.name));
    const openPositions = POSITIONS.filter((pos) => !state.slots[pos]);
    const canFillOpen = (player) => player.positions.some((pos) => openPositions.includes(pos));
    players = [
      ...players.filter(canFillOpen),
      ...players.filter((player) => !canFillOpen(player))
    ].slice(0, 16);
    if (currentFilter === "G") return players.filter((player) => player.positions.some((pos) => pos === "PG" || pos === "SG"));
    if (currentFilter === "F") return players.filter((player) => player.positions.some((pos) => pos === "SF" || pos === "PF"));
    if (currentFilter === "C") return players.filter((player) => player.positions.includes("C"));
    return players;
  }

  function fmt(value) {
    return value == null ? "-" : Number(value).toFixed(1).replace(/\.0$/, "");
  }

  function selectPlayer(player) {
    const openPositions = player.positions.filter((pos) => !state.slots[pos]);
    if (!openPositions.length) {
      els.draftHint.textContent = `${player.name} 可打的位置已经满了。`;
      pendingPick = null;
      renderRoster();
      renderPlayers();
      return;
    }
    pendingPick = player;
    els.draftHint.textContent = `选择上方高亮位置放入 ${player.name}`;
    renderRoster();
    renderPlayers();
  }

  function placePending(pos) {
    if (!pendingPick || state.slots[pos] || !pendingPick.positions.includes(pos)) return;
    state.slots[pos] = { ...pendingPick, assignedPos: pos };
    usedNames.add(pendingPick.name);
    pendingPick = null;
    state.round += 1;
    renderRoster();
    els.draftArea.hidden = true;
    els.spinBtn.disabled = true;
    els.skipTeamBtn.disabled = true;
    els.skipEraBtn.disabled = true;
    window.setTimeout(nextRound, 560);
  }

  function playerRating(player) {
    const bench = ERA_BENCHMARKS[player.era] || ERA_BENCHMARKS["2020s"];
    const basePosition = player.assignedPos || player.positions[0] || player.pos || "SF";
    const weights = { ...(POSITION_WEIGHTS[basePosition] || POSITION_WEIGHTS.SF) };
    const keys = ["pts", "reb", "ast", "stl", "blk"];
    const missing = keys.filter((key) => player[key] == null);
    if (missing.length) {
      const keptWeight = keys.filter((key) => !missing.includes(key)).reduce((sum, key) => sum + weights[key], 0);
      const scale = keptWeight > 0 ? 1 / keptWeight : 1;
      keys.forEach((key) => {
        weights[key] = missing.includes(key) ? 0 : weights[key] * scale;
      });
    }

    let normalized = 0;
    keys.forEach((key) => {
      if (player[key] == null) return;
      let ratio = player[key] / bench[key];
      if (ratio > 1) ratio = Math.pow(ratio, 1.18);
      normalized += weights[key] * ratio;
    });

    const versatility = Math.max(0, player.positions.length - 1) * 2.2;
    const positionFit = player.positions.includes(player.assignedPos) ? 3 : -4;
    return Math.min(100, Math.round((58 + normalized * 40 + versatility + positionFit) * 10) / 10);
  }

  function finishSeason() {
    const roster = POSITIONS.map((pos) => state.slots[pos]).filter(Boolean);
    const ratings = roster.map(playerRating);
    const product = ratings.reduce((acc, value) => acc * value, 1);
    const geoMean = Math.pow(product, 1 / ratings.length);
    const avg = ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
    const balancePenalty = Math.max(0, avg - Math.min(...ratings)) * 0.22;
    const teamOvr = Math.max(0, Math.min(112, geoMean * 1.11 - balancePenalty));
    const wins = Math.max(0, Math.min(82, Math.round(82 * Math.pow(Math.min(teamOvr / 109, 1), 2.18))));
    const losses = 82 - wins;
    const band = GRADE_BANDS.find((item) => wins >= item.min) || GRADE_BANDS[GRADE_BANDS.length - 1];

    state.result = { wins, losses, band, ratings, teamOvr, mode: state.mode, budgetLeft: state.budget };
    showScreen("screen-result");
    renderResult();
    if (wins >= 80) burstConfetti();
  }

  function renderResult() {
    const { wins, losses, band, teamOvr } = state.result;
    els.recordText.textContent = `${wins}-${losses}`;
    els.gradeText.textContent = band.grade;
    els.gradeText.style.color = band.color;
    els.tierText.textContent = band.label;
    els.tierText.style.color = band.color;
    const rentalText = state.result.mode === "rental" ? ` 租队预算剩余 $${state.result.budgetLeft}。` : "";
    els.verdictText.textContent = `${band.verdict} 综合强度 ${teamOvr.toFixed(1)}，胜场完成度 ${Math.round((wins / 82) * 100)}%。${rentalText}`;
    requestAnimationFrame(() => {
      els.meterFill.style.width = `${Math.round((wins / 82) * 100)}%`;
    });

    els.resultRoster.innerHTML = "";
    POSITIONS.forEach((pos) => {
      const player = state.slots[pos];
      const slot = document.createElement("div");
      slot.className = "position-slot filled";
      applyTeamColors(slot, player.team);
      slot.innerHTML = `<strong></strong><small></small>`;
      slot.querySelector("strong").textContent = player.name;
      slot.querySelector("small").textContent = `${pos} · ${teamName(player.team)} · ${player.era}`;
      els.resultRoster.appendChild(slot);
    });
  }

  function generatePoster() {
    if (!state.result) return;
    const canvas = els.posterCanvas;
    const ctx = canvas.getContext("2d");
    const { wins, losses, band } = state.result;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bg.addColorStop(0, "#17110f");
    bg.addColorStop(0.5, "#26201b");
    bg.addColorStop(1, "#10191a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(247,239,225,0.16)";
    ctx.lineWidth = 6;
    roundRect(ctx, 74, 72, 752, 1256, 32);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(450, 260, 128, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(450, 1230, 180, Math.PI, 0);
    ctx.stroke();

    ctx.fillStyle = "#f6c85f";
    ctx.font = "38px 'Bebas Neue', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(state.result.mode === "rental" ? "20 DOLLAR RENTAL DRAFT" : "PERFECT SEASON CHALLENGE", 450, 138);

    ctx.fillStyle = "#f7efe1";
    ctx.font = "170px 'Bebas Neue', sans-serif";
    ctx.fillText(`${wins}-${losses}`, 450, 330);

    ctx.fillStyle = band.color;
    ctx.font = "900 56px 'Noto Sans SC', sans-serif";
    ctx.fillText(`${band.grade} · ${band.label}`, 450, 412);

    POSITIONS.forEach((pos, index) => {
      const player = state.slots[pos];
      const y = 520 + index * 136;
      const [a, b] = TEAM_COLORS[player.team] || ["#333", "#555"];
      const card = ctx.createLinearGradient(105, y - 58, 795, y + 58);
      card.addColorStop(0, a);
      card.addColorStop(1, b);
      ctx.fillStyle = card;
      roundRect(ctx, 105, y - 58, 690, 112, 18);
      ctx.fill();

      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(105, y - 58, 96, 112);
      ctx.fillStyle = "#f7efe1";
      ctx.font = "54px 'Bebas Neue', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(pos, 153, y + 18);

      ctx.textAlign = "left";
      ctx.font = "900 34px 'Noto Sans SC', sans-serif";
      ctx.fillText(trimText(ctx, player.name, 410), 230, y - 10);
      ctx.font = "24px 'Noto Sans SC', sans-serif";
      ctx.fillText(`${teamName(player.team)} · ${player.era} · ${fmt(player.pts)}/${fmt(player.reb)}/${fmt(player.ast)}`, 230, y + 30);
    });

    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(247,239,225,0.72)";
    ctx.font = "24px 'Noto Sans SC', sans-serif";
    const footer = state.result.mode === "rental"
      ? `20块租队模式 · 剩余预算 $${state.result.budgetLeft}`
      : "五轮选秀生成的历史阵容战绩预测";
    ctx.fillText(footer, 450, 1240);

    els.posterOverlay.hidden = false;
  }

  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }

  function trimText(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let next = text;
    while (next.length > 1 && ctx.measureText(`${next}...`).width > maxWidth) {
      next = next.slice(0, -1);
    }
    return `${next}...`;
  }

  function downloadPoster() {
    const link = document.createElement("a");
    link.download = `perfect-season-${Date.now()}.png`;
    link.href = els.posterCanvas.toDataURL("image/png");
    link.click();
  }

  function initMotionCourt() {
    const canvas = document.getElementById("motion-court");
    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = 0;
    let dots = [];

    function resize() {
      width = canvas.width = window.innerWidth * window.devicePixelRatio;
      height = canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      dots = Array.from({ length: Math.min(70, Math.floor(window.innerWidth / 7)) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: (Math.random() * 1.8 + 0.6) * window.devicePixelRatio,
        vx: (Math.random() - 0.5) * 0.22 * window.devicePixelRatio,
        vy: (Math.random() - 0.5) * 0.22 * window.devicePixelRatio,
        c: Math.random() > 0.55 ? "246,200,95" : "44,199,166"
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      dots.forEach((dot) => {
        dot.x += dot.vx;
        dot.y += dot.vy;
        if (dot.x < 0) dot.x = width;
        if (dot.x > width) dot.x = 0;
        if (dot.y < 0) dot.y = height;
        if (dot.y > height) dot.y = 0;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${dot.c},0.34)`;
        ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    draw();
  }

  function burstConfetti() {
    for (let i = 0; i < 90; i += 1) {
      const piece = document.createElement("span");
      piece.style.position = "fixed";
      piece.style.zIndex = "39";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.top = "-20px";
      piece.style.width = "8px";
      piece.style.height = "14px";
      piece.style.background = ["#f6c85f", "#2cc7a6", "#c85d2d", "#3e8ed0"][i % 4];
      piece.style.transform = `rotate(${Math.random() * 180}deg)`;
      piece.style.animation = `fall ${2.2 + Math.random() * 1.8}s ease-in forwards`;
      document.body.appendChild(piece);
      window.setTimeout(() => piece.remove(), 4400);
    }
  }

  function ensureFallKeyframes() {
    const style = document.createElement("style");
    style.textContent = "@keyframes fall{to{transform:translateY(110vh) rotate(720deg);opacity:0}}";
    document.head.appendChild(style);
  }

  function bindEvents() {
    els.modeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        selectedMode = button.dataset.mode;
        els.modeButtons.forEach((item) => item.classList.toggle("active", item === button));
      });
    });
    els.startBtn.addEventListener("click", resetGame);
    els.homeBtn.addEventListener("click", returnHome);
    els.restartBtn.addEventListener("click", resetGame);
    els.againBtn.addEventListener("click", resetGame);
    els.resultHomeBtn.addEventListener("click", returnHome);
    els.spinBtn.addEventListener("click", spinCombo);
    els.skipTeamBtn.addEventListener("click", skipTeam);
    els.skipEraBtn.addEventListener("click", skipEra);
    els.posterBtn.addEventListener("click", generatePoster);
    els.closePosterBtn.addEventListener("click", () => {
      els.posterOverlay.hidden = true;
    });
    els.downloadPosterBtn.addEventListener("click", downloadPoster);
    els.rulesBtn.addEventListener("click", () => {
      if (typeof els.rulesDialog.showModal === "function") {
        els.rulesDialog.showModal();
      }
    });
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        currentFilter = tab.dataset.filter;
        document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item === tab));
        pendingPick = null;
        renderRoster();
        renderPlayers();
      });
    });
  }

  initData();
  bindEvents();
  ensureFallKeyframes();
  initMotionCourt();
})();

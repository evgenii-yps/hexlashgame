import { useState, useEffect, useRef, useCallback } from "react";

/* ──────────────────────────────────────────────
   DICE ITEMS — 6 граней кубика
   ────────────────────────────────────────────── */
const DICE_ITEMS = [
  { id: 1, name: "АПТЕЧКА", emoji: "💊", color: "#00E676", desc: "+10% HP", effect: "heal" },
  { id: 2, name: "АДРЕНАЛИН", emoji: "⚡", color: "#FF9100", desc: "2x урон", effect: "double" },
  { id: 3, name: "ЩИТ", emoji: "🛡️", color: "#448AFF", desc: "Блок атаки", effect: "shield" },
  { id: 4, name: "ОСЛЕПЛЕНИЕ", emoji: "✨", color: "#E040FB", desc: "Промах врага", effect: "blind" },
  { id: 5, name: "ЯРОСТЬ", emoji: "🔥", color: "#FF1744", desc: "3x удар", effect: "rage" },
  { id: 6, name: "КРИТ", emoji: "💀", color: "#FFD600", desc: "−30% HP", effect: "crit" },
];

/* NFT модули (демо — будущая интеграция с CoC FIT NFT) */
const NFT_MODULES = [
  { name: "Berserker", color: "#FF1744", icon: "⚔️" },
  { name: "Fortress", color: "#448AFF", icon: "🏰" },
  { name: "Phantom", color: "#E040FB", icon: "👻" },
];

const FIGHT_ACTIONS = [
  "удар в голову", "удар в корпус", "апперкот", "хук слева",
  "джеб", "лоу-кик", "хук справа", "боди-шот",
];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/* ──────────────────────────────────────────────
   MAIN COMPONENT
   ────────────────────────────────────────────── */
export default function HexlashBattle() {
  const [screen, setScreen] = useState("menu");
  const [countdown, setCountdown] = useState(3);
  const [pHP, setPHP] = useState(100);
  const [eHP, setEHP] = useState(100);
  const [round, setRound] = useState(0);
  const [log, setLog] = useState([]);
  const [diceRolling, setDiceRolling] = useState(false);
  const [diceValue, setDiceValue] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [itemTimer, setItemTimer] = useState(0);
  const [itemUsed, setItemUsed] = useState(false);
  const [pShield, setPShield] = useState(false);
  const [eBlind, setEBlind] = useState(false);
  const [nextDouble, setNextDouble] = useState(false);
  const [pAction, setPAction] = useState("");
  const [eAction, setEAction] = useState("");
  const [winner, setWinner] = useState(null);
  const [overrideReady, setOverrideReady] = useState(false);
  const [score, setScore] = useState({ w: 0, l: 0 });
  const [shakeP, setShakeP] = useState(false);
  const [shakeE, setShakeE] = useState(false);
  const [flashScreen, setFlashScreen] = useState(null);
  const [totalDmgDealt, setTotalDmgDealt] = useState(0);
  const [totalDmgTaken, setTotalDmgTaken] = useState(0);
  const [itemsUsed, setItemsUsed] = useState(0);
  const [overridesHit, setOverridesHit] = useState(0);

  const fightRef = useRef(null);
  const diceRef = useRef(null);
  const itemRef = useRef(null);
  const logEndRef = useRef(null);

  const addLog = useCallback((text, type = "normal") => {
    setLog(prev => [...prev.slice(-12), { text, type, id: Date.now() + Math.random() }]);
  }, []);

  const reset = useCallback(() => {
    setPHP(100); setEHP(100); setRound(0); setLog([]);
    setDiceValue(null); setActiveItem(null); setPShield(false);
    setEBlind(false); setNextDouble(false); setPAction(""); setEAction("");
    setWinner(null); setOverrideReady(false); setItemUsed(false);
    setFlashScreen(null); setTotalDmgDealt(0); setTotalDmgTaken(0);
    setItemsUsed(0); setOverridesHit(0);
    [fightRef, diceRef, itemRef].forEach(r => { clearInterval(r.current); clearTimeout(r.current); });
  }, []);

  const startGame = useCallback(() => { reset(); setScreen("countdown"); setCountdown(3); }, [reset]);

  /* ── Countdown ── */
  useEffect(() => {
    if (screen !== "countdown") return;
    if (countdown <= 0) { setScreen("fighting"); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 700);
    return () => clearTimeout(t);
  }, [screen, countdown]);

  /* ── Fight loop ── */
  useEffect(() => {
    if (screen !== "fighting") return;

    const doRound = () => {
      setRound(r => r + 1);

      setPHP(php => {
        setEHP(ehp => {
          if (php <= 0 || ehp <= 0) return ehp;

          const pa = FIGHT_ACTIONS[rand(0, 7)];
          const ea = FIGHT_ACTIONS[rand(0, 7)];
          setPAction(pa); setEAction(ea);

          let pDmg = rand(6, 14);
          let eDmg = rand(6, 14);

          if (nextDouble) { pDmg *= 2; setNextDouble(false); addLog(`⚡ Адреналин! ${pDmg} урона!`, "buff"); }
          if (pShield) { eDmg = 0; setPShield(false); addLog("🛡️ Щит поглотил удар!", "buff"); }
          if (eBlind) { eDmg = 0; setEBlind(false); addLog("✨ Противник промахнулся!", "buff"); }

          const dodge = Math.random() < 0.12;
          const counter = Math.random() < 0.08;

          if (dodge) { eDmg = 0; addLog(`Уклонение от ${ea}!`, "dodge"); }
          else if (eDmg > 0) {
            addLog(`← ${ea} → ${eDmg} урона`, "enemy");
            setShakeP(true); setTimeout(() => setShakeP(false), 250);
            setTotalDmgTaken(t => t + eDmg);
          }

          if (counter) {
            pDmg = Math.floor(pDmg * 1.5);
            addLog(`Контратака! ${pa} → ${pDmg}!`, "crit");
          } else if (pDmg > 0) {
            addLog(`→ ${pa} → ${pDmg} урона`, "player");
          }

          if (pDmg > 0) {
            setShakeE(true); setTimeout(() => setShakeE(false), 250);
            setTotalDmgDealt(t => t + pDmg);
          }

          const newP = Math.max(0, php - eDmg);
          const newE = Math.max(0, ehp - pDmg);
          setPHP(newP);

          if (newE <= 0 || newP <= 0) {
            setTimeout(() => {
              const w = newE <= 0 && newP > 0 ? "player" : newP <= 0 && newE > 0 ? "enemy" : "draw";
              setWinner(w);
              if (w === "player") { setScore(s => ({ ...s, w: s.w + 1 })); addLog("🏆 ПОБЕДА!", "win"); }
              else if (w === "enemy") { setScore(s => ({ ...s, l: s.l + 1 })); addLog("💀 ПОРАЖЕНИЕ", "loss"); }
              else addLog("🤝 НИЧЬЯ", "normal");
              setScreen("ended");
              clearInterval(fightRef.current); clearInterval(diceRef.current);
            }, 400);
          }

          // Manual Override window (random)
          if (Math.random() < 0.12 && newE > 0 && newP > 0) {
            setOverrideReady(true);
            setTimeout(() => setOverrideReady(false), 2200);
          }

          return newE;
        });
        return php;
      });
    };

    fightRef.current = setInterval(doRound, 1900);
    return () => clearInterval(fightRef.current);
  }, [screen, addLog, nextDouble, pShield, eBlind]);

  /* ── Dice timer ── */
  useEffect(() => {
    if (screen !== "fighting") return;

    const rollDice = () => {
      setDiceRolling(true); setDiceValue(null); setActiveItem(null); setItemUsed(false);

      let rolls = 0;
      const anim = setInterval(() => {
        setDiceValue(rand(1, 6));
        if (++rolls > 10) {
          clearInterval(anim);
          const val = rand(1, 6);
          setDiceValue(val); setDiceRolling(false);
          const item = DICE_ITEMS[val - 1];
          setActiveItem(item); setItemTimer(3);
          addLog(`🎲 Кубик: ${val} → ${item.emoji} ${item.name}`, "dice");

          let cd = 3;
          const countInterval = setInterval(() => {
            if (--cd <= 0) { clearInterval(countInterval); setActiveItem(null); }
            setItemTimer(cd);
          }, 1000);
          itemRef.current = countInterval;
        }
      }, 80);
    };

    const initial = setTimeout(rollDice, 2500);
    diceRef.current = setInterval(rollDice, 7000);
    return () => { clearInterval(diceRef.current); clearTimeout(initial); };
  }, [screen, addLog]);

  /* ── Auto-scroll log ── */
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [log]);

  /* ── Activate item ── */
  const useItem = useCallback(() => {
    if (!activeItem || itemUsed) return;
    setItemUsed(true); setItemsUsed(n => n + 1);
    setFlashScreen(activeItem.color);
    setTimeout(() => setFlashScreen(null), 300);

    switch (activeItem.effect) {
      case "heal": setPHP(hp => Math.min(100, hp + 10)); addLog("💊 +10 HP!", "buff"); break;
      case "double": setNextDouble(true); addLog("⚡ Следующий удар 2x!", "buff"); break;
      case "shield": setPShield(true); addLog("🛡️ Щит активен!", "buff"); break;
      case "blind": setEBlind(true); addLog("✨ Ослепление!", "buff"); break;
      case "rage":
        setEHP(hp => Math.max(0, hp - 20)); setShakeE(true);
        setTimeout(() => setShakeE(false), 400);
        setTotalDmgDealt(t => t + 20);
        addLog("🔥 ЯРОСТЬ! −20 HP!", "crit"); break;
      case "crit":
        setEHP(hp => Math.max(0, hp - 30)); setShakeE(true);
        setTimeout(() => setShakeE(false), 400);
        setTotalDmgDealt(t => t + 30);
        addLog("💀 КРИТ! −30 HP!", "crit"); break;
    }
    setTimeout(() => setActiveItem(null), 400);
  }, [activeItem, itemUsed, addLog]);

  /* ── Manual Override ── */
  const doOverride = useCallback(() => {
    if (!overrideReady) return;
    setOverrideReady(false); setOverridesHit(n => n + 1);
    const dmg = rand(22, 38);
    setEHP(hp => Math.max(0, hp - dmg));
    setShakeE(true); setTimeout(() => setShakeE(false), 400);
    setTotalDmgDealt(t => t + dmg);
    setFlashScreen("#FF1744"); setTimeout(() => setFlashScreen(null), 200);
    addLog(`⚔️ OVERRIDE! −${dmg} HP!`, "crit");
  }, [overrideReady, addLog]);

  const hpCol = hp => hp > 60 ? "#00E676" : hp > 30 ? "#FF9100" : "#FF1744";

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     MENU SCREEN
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  if (screen === "menu") {
    return (
      <div style={S.container}>
        <div style={S.bg} />
        <div style={S.menuWrap}>
          <div style={S.logo}>HEXLASH</div>
          <div style={S.tagline}>AI BATTLE · BASE CHAIN · OWB ECOSYSTEM</div>

          {/* NFT Module Slots Preview */}
          <div style={S.nftSection}>
            <div style={S.nftTitle}>NFT МОДУЛИ АВАТАРА</div>
            <div style={S.nftSlots}>
              {NFT_MODULES.map((m, i) => (
                <div key={i} style={{ ...S.nftSlot, borderColor: m.color, boxShadow: `0 0 12px ${m.color}22` }}>
                  <span style={{ fontSize: 20 }}>{m.icon}</span>
                  <span style={{ fontSize: 9, color: m.color, fontWeight: 700 }}>{m.name}</span>
                  <span style={{ fontSize: 8, color: "#555" }}>FIT NFT</span>
                </div>
              ))}
              <div style={{ ...S.nftSlot, borderColor: "#333", borderStyle: "dashed" }}>
                <span style={{ fontSize: 16, color: "#333" }}>+</span>
                <span style={{ fontSize: 8, color: "#333" }}>SLOT 4</span>
              </div>
            </div>
          </div>

          {/* Dice Items */}
          <div style={S.nftTitle}>КУБИК СУДЬБЫ — 6 ПРЕДМЕТОВ</div>
          <div style={S.diceGrid}>
            {DICE_ITEMS.map(item => (
              <div key={item.id} style={{ ...S.dicePreviewItem, borderColor: item.color + "66" }}>
                <span style={{ fontSize: 18 }}>{item.emoji}</span>
                <span style={{ fontSize: 9, color: item.color, fontWeight: 700 }}>{item.name}</span>
                <span style={{ fontSize: 8, color: "#666" }}>{item.desc}</span>
              </div>
            ))}
          </div>

          <button onClick={startGame} style={S.fightBtn}>⚔️ В БОЙ</button>

          <div style={S.hint}>
            Бой идёт автоматически · Тапай предметы кубика · Лови Manual Override
          </div>

          <div style={S.version}>
            Hexlash v0.1 · Demo Build · OWB Integration Preview
          </div>
        </div>
        <style>{CSS}</style>
      </div>
    );
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     COUNTDOWN
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  if (screen === "countdown") {
    return (
      <div style={S.container}>
        <div style={S.bg} />
        <div style={S.cdWrap}>
          <div key={countdown} style={S.cdNum}>
            {countdown > 0 ? countdown : "FIGHT!"}
          </div>
        </div>
        <style>{CSS}</style>
      </div>
    );
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     BATTLE + END SCREEN
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  return (
    <div style={S.container}>
      <div style={S.bg} />
      {flashScreen && <div style={{ ...S.flash, background: flashScreen }} />}

      <div style={S.battleWrap}>
        {/* Header */}
        <div style={S.header}>
          <div style={S.headerLogo}>HEXLASH</div>
          <div style={S.roundBadge}>R{round}</div>
          <div style={S.scoreBadge}>{score.w}W · {score.l}L</div>
        </div>

        {/* Fighters Row */}
        <div style={S.fRow}>
          {/* Player */}
          <div style={{ ...S.fCard, transform: shakeP ? "translateX(-6px)" : "none" }}>
            <div style={S.fLabel}>ВАШ АВАТАР</div>
            <div style={{ ...S.fAvatar, borderColor: hpCol(pHP), boxShadow: `0 0 24px ${hpCol(pHP)}33` }}>
              <span style={{ fontSize: 34 }}>🥊</span>
              {pShield && <div style={{ ...S.badge, top: -6, left: -6 }}>🛡️</div>}
              {nextDouble && <div style={{ ...S.badge, top: -6, right: -6 }}>⚡</div>}
            </div>
            {/* NFT slots mini */}
            <div style={S.miniSlots}>
              {NFT_MODULES.map((m, i) => (
                <div key={i} style={{ ...S.miniSlot, background: m.color + "33", borderColor: m.color + "66" }} title={m.name}>
                  <span style={{ fontSize: 10 }}>{m.icon}</span>
                </div>
              ))}
            </div>
            <div style={S.hpOuter}>
              <div style={{ ...S.hpInner, width: `${pHP}%`, background: hpCol(pHP) }} />
            </div>
            <div style={{ ...S.hpNum, color: hpCol(pHP) }}>{pHP}</div>
            {pAction && <div style={S.actText} key={pAction + round}>{pAction}</div>}
          </div>

          {/* VS + Dice */}
          <div style={S.vsCol}>
            <div style={S.vs}>VS</div>
            <div style={{ ...S.dice, animation: diceRolling ? "diceShake 0.08s infinite alternate" : "none" }}>
              {diceValue
                ? <span style={{ fontSize: 26, filter: diceRolling ? "blur(1px)" : "none", transition: "filter 0.1s" }}>
                    {["⚀","⚁","⚂","⚃","⚄","⚅"][diceValue - 1]}
                  </span>
                : <span style={{ fontSize: 16, color: "#444" }}>🎲</span>
              }
            </div>
          </div>

          {/* Enemy */}
          <div style={{ ...S.fCard, transform: shakeE ? "translateX(6px)" : "none" }}>
            <div style={S.fLabel}>ПРОТИВНИК</div>
            <div style={{ ...S.fAvatar, borderColor: hpCol(eHP), boxShadow: `0 0 24px ${hpCol(eHP)}33` }}>
              <span style={{ fontSize: 34 }}>👊</span>
              {eBlind && <div style={{ ...S.badge, top: -6, left: -6 }}>✨</div>}
            </div>
            <div style={S.miniSlots}>
              <div style={{ ...S.miniSlot, background: "#FF174433", borderColor: "#FF174466" }}><span style={{ fontSize: 10 }}>🗡️</span></div>
              <div style={{ ...S.miniSlot, background: "#FFD60033", borderColor: "#FFD60066" }}><span style={{ fontSize: 10 }}>💎</span></div>
            </div>
            <div style={S.hpOuter}>
              <div style={{ ...S.hpInner, width: `${eHP}%`, background: hpCol(eHP) }} />
            </div>
            <div style={{ ...S.hpNum, color: hpCol(eHP) }}>{eHP}</div>
            {eAction && <div style={S.actText} key={eAction + round}>{eAction}</div>}
          </div>
        </div>

        {/* Active Item Button */}
        {activeItem && !itemUsed && screen === "fighting" && (
          <button onClick={useItem} style={{ ...S.itemBtn, borderColor: activeItem.color, boxShadow: `0 0 30px ${activeItem.color}33`, animation: "itemPulse 0.4s infinite alternate" }}>
            <span style={{ fontSize: 26 }}>{activeItem.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: activeItem.color, fontWeight: 800, fontSize: 13 }}>{activeItem.name}</div>
              <div style={{ color: "#777", fontSize: 10 }}>{activeItem.desc}</div>
            </div>
            <div style={{ ...S.timerPill, background: activeItem.color }}>{itemTimer}s</div>
            <div style={S.tapHint}>TAP</div>
          </button>
        )}

        {/* Manual Override */}
        {overrideReady && screen === "fighting" && (
          <button onClick={doOverride} style={{ ...S.overrideBtn, animation: "overridePulse 0.25s infinite alternate" }}>
            ⚔️ MANUAL OVERRIDE
          </button>
        )}

        {/* Battle Log */}
        <div style={S.logBox}>
          {log.map(e => (
            <div key={e.id} style={{
              ...S.logLine,
              color: { crit: "#FF1744", buff: "#00E676", dice: "#FFD600", player: "#448AFF", enemy: "#FF6D00", dodge: "#E040FB", win: "#00E676", loss: "#FF1744" }[e.type] || "#666"
            }}>
              {e.text}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>

        {/* Watermark */}
        <div style={S.watermark}>hexlash.com · OWB ecosystem · Base chain</div>
      </div>

      {/* ── END SCREEN ── */}
      {screen === "ended" && (
        <div style={S.endOverlay}>
          <div style={S.endCard}>
            <div style={{ fontSize: 52 }}>
              {winner === "player" ? "🏆" : winner === "enemy" ? "💀" : "🤝"}
            </div>
            <div style={{ ...S.endTitle, color: winner === "player" ? "#00E676" : winner === "enemy" ? "#FF1744" : "#FFD600" }}>
              {winner === "player" ? "ПОБЕДА!" : winner === "enemy" ? "ПОРАЖЕНИЕ" : "НИЧЬЯ"}
            </div>

            {/* Stats */}
            <div style={S.statsGrid}>
              <div style={S.statItem}>
                <div style={S.statNum}>{round}</div>
                <div style={S.statLabel}>Раундов</div>
              </div>
              <div style={S.statItem}>
                <div style={{ ...S.statNum, color: "#448AFF" }}>{totalDmgDealt}</div>
                <div style={S.statLabel}>Урон нанесён</div>
              </div>
              <div style={S.statItem}>
                <div style={{ ...S.statNum, color: "#FF6D00" }}>{totalDmgTaken}</div>
                <div style={S.statLabel}>Урон получен</div>
              </div>
              <div style={S.statItem}>
                <div style={{ ...S.statNum, color: "#FFD600" }}>{itemsUsed}</div>
                <div style={S.statLabel}>Предметов</div>
              </div>
              <div style={S.statItem}>
                <div style={{ ...S.statNum, color: "#FF1744" }}>{overridesHit}</div>
                <div style={S.statLabel}>Override</div>
              </div>
              <div style={S.statItem}>
                <div style={{ ...S.statNum, color: "#00E676" }}>{pHP}</div>
                <div style={S.statLabel}>HP осталось</div>
              </div>
            </div>

            {/* AI Trainer analysis placeholder */}
            <div style={S.aiBox}>
              <div style={S.aiTitle}>🤖 ИИ-ТРЕНЕР (Claude API)</div>
              <div style={S.aiText}>
                {winner === "player"
                  ? "Отличный бой! Ваш аватар эффективно использовал контратаки. Рекомендация: модуль Berserker усилит агрессию в первых раундах."
                  : "Аватар получил слишком много урона в начале боя. Рекомендация: установите модуль Fortress в слот 2 для усиления защиты на старте."
                }
              </div>
            </div>

            <button onClick={startGame} style={S.fightBtn}>🔄 ЕЩЁ БОЙ</button>
          </div>
        </div>
      )}

      <style>{CSS}</style>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CSS ANIMATIONS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const CSS = `
  @keyframes diceShake { 0%{transform:rotate(-8deg)scale(1.1)} 100%{transform:rotate(8deg)scale(1.1)} }
  @keyframes itemPulse { 0%{transform:scale(1)} 100%{transform:scale(1.02)} }
  @keyframes overridePulse { 0%{box-shadow:0 0 15px #FF174433} 100%{box-shadow:0 0 35px #FF174477} }
  @keyframes fadeSlideIn { 0%{opacity:0;transform:translateY(4px)} 100%{opacity:1;transform:translateY(0)} }
  @keyframes pulseIn { 0%{transform:scale(2.5);opacity:0} 100%{transform:scale(1);opacity:1} }
  @keyframes flash { 0%{opacity:.3} 100%{opacity:0} }
  * { -webkit-tap-highlight-color: transparent; user-select: none; }
`;

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   STYLES
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const S = {
  container: { width: "100%", minHeight: "100dvh", background: "#0a0a0f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'SF Pro Display','Segoe UI',system-ui,sans-serif", position: "relative", overflow: "hidden", color: "#fff" },
  bg: { position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%,#1a0a2e15 0%,transparent 70%),radial-gradient(ellipse at 80% 100%,#0a1a2e15 0%,transparent 50%)", pointerEvents: "none" },
  flash: { position: "fixed", inset: 0, zIndex: 50, opacity: 0.2, animation: "flash 0.3s forwards", pointerEvents: "none" },

  // Menu
  menuWrap: { position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "16px 20px", maxWidth: 400, width: "100%" },
  logo: { fontSize: 38, fontWeight: 900, letterSpacing: 8, background: "linear-gradient(135deg,#FF1744,#FF9100,#FFD600)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  tagline: { fontSize: 10, letterSpacing: 4, color: "#555", marginBottom: 8 },
  nftSection: { width: "100%", marginBottom: 4 },
  nftTitle: { fontSize: 9, letterSpacing: 3, color: "#555", textAlign: "center", marginBottom: 8 },
  nftSlots: { display: "flex", gap: 8, justifyContent: "center" },
  nftSlot: { display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "8px 10px", borderRadius: 10, border: "1px solid", background: "#0f0f18" },
  diceGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, width: "100%", marginBottom: 12 },
  dicePreviewItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: 1, padding: "8px 4px", borderRadius: 8, border: "1px solid", background: "#0f0f18" },
  fightBtn: { padding: "14px 52px", fontSize: 17, fontWeight: 800, letterSpacing: 4, color: "#fff", background: "linear-gradient(135deg,#FF1744,#D50000)", border: "none", borderRadius: 14, cursor: "pointer", boxShadow: "0 4px 20px #FF174444", transition: "transform 0.1s", marginTop: 4 },
  hint: { color: "#444", fontSize: 10, textAlign: "center", lineHeight: 1.5, maxWidth: 280 },
  version: { color: "#2a2a33", fontSize: 9, letterSpacing: 2, marginTop: 8 },

  // Countdown
  cdWrap: { position: "relative", zIndex: 1 },
  cdNum: { fontSize: 68, fontWeight: 900, color: "#FF1744", textShadow: "0 0 40px #FF174455", animation: "pulseIn 0.5s ease-out" },

  // Battle
  battleWrap: { position: "relative", zIndex: 1, width: "100%", maxWidth: 400, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8, minHeight: "100dvh" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  headerLogo: { fontSize: 13, fontWeight: 900, letterSpacing: 4, background: "linear-gradient(90deg,#FF1744,#FF9100)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  roundBadge: { fontSize: 10, fontWeight: 700, color: "#666", padding: "2px 8px", borderRadius: 12, border: "1px solid #2a2a33" },
  scoreBadge: { fontSize: 10, color: "#444" },

  fRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 },
  fCard: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "transform 0.1s" },
  fLabel: { fontSize: 8, fontWeight: 700, letterSpacing: 2, color: "#555" },
  fAvatar: { width: 72, height: 72, borderRadius: "50%", border: "2px solid", background: "#0f0f18", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", transition: "border-color 0.3s,box-shadow 0.3s" },
  badge: { position: "absolute", fontSize: 16 },
  miniSlots: { display: "flex", gap: 3 },
  miniSlot: { width: 20, height: 20, borderRadius: 5, border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center" },
  hpOuter: { width: "100%", height: 5, borderRadius: 3, background: "#1a1a22", overflow: "hidden" },
  hpInner: { height: "100%", borderRadius: 3, transition: "width 0.3s" },
  hpNum: { fontSize: 15, fontWeight: 800, fontVariantNumeric: "tabular-nums" },
  actText: { fontSize: 9, color: "#555", padding: "2px 6px", borderRadius: 4, background: "#111118", animation: "fadeSlideIn 0.25s", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 110 },

  vsCol: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, paddingTop: 20 },
  vs: { fontSize: 14, fontWeight: 900, color: "#2a2a33", letterSpacing: 4 },
  dice: { width: 44, height: 44, borderRadius: 10, border: "1px solid #2a2a33", background: "#0f0f18", display: "flex", alignItems: "center", justifyContent: "center" },

  itemBtn: { width: "100%", padding: "10px 14px", borderRadius: 12, border: "2px solid", background: "#0f0f18", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", position: "relative", color: "#fff", transition: "transform 0.1s" },
  timerPill: { padding: "3px 10px", borderRadius: 16, fontSize: 12, fontWeight: 800, color: "#000" },
  tapHint: { position: "absolute", bottom: 4, right: 14, fontSize: 8, color: "#555", letterSpacing: 2, fontWeight: 700 },

  overrideBtn: { width: "100%", padding: "12px", borderRadius: 12, border: "2px solid #FF1744", background: "linear-gradient(135deg,#1a0a0e,#250a0e)", color: "#FF1744", fontSize: 15, fontWeight: 900, letterSpacing: 3, cursor: "pointer", textAlign: "center" },

  logBox: { flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: "6px 0", overflowY: "auto", minHeight: 100, maxHeight: 180 },
  logLine: { fontSize: 10, padding: "2px 0", borderBottom: "1px solid #111118", animation: "fadeSlideIn 0.2s" },

  watermark: { textAlign: "center", fontSize: 8, color: "#1a1a22", letterSpacing: 2, padding: "8px 0" },

  // End screen
  endOverlay: { position: "fixed", inset: 0, background: "rgba(5,5,10,0.95)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 80, padding: 16 },
  endCard: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, maxWidth: 360, width: "100%" },
  endTitle: { fontSize: 32, fontWeight: 900, letterSpacing: 6 },

  statsGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, width: "100%" },
  statItem: { display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 4px", borderRadius: 8, background: "#0f0f18", border: "1px solid #1a1a22" },
  statNum: { fontSize: 18, fontWeight: 800, color: "#fff" },
  statLabel: { fontSize: 8, color: "#555", letterSpacing: 1 },

  aiBox: { width: "100%", padding: 12, borderRadius: 10, background: "#0f0f18", border: "1px solid #1a1a22" },
  aiTitle: { fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#FFD600", marginBottom: 6 },
  aiText: { fontSize: 11, color: "#888", lineHeight: 1.5 },
};

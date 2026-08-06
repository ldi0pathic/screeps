/**
 * Versand des Profilerberichts per `Game.notify`.
 *
 * Der Bericht auf der Konsole (`report.ts`) ist weg, sobald der Moment
 * verpasst ist. `Game.notify` schickt Text an die im Screeps-Profil
 * hinterlegte E-Mail-Adresse und überlebt damit das Spiel.
 *
 * Reines Textmodul wie `report.ts`: keine Konsolenausgabe, kein Zustand.
 * Importiert absichtlich nichts aus dem übrigen Profiler — siehe die
 * Abhängigkeitsrichtung im Kopf von `./types`.
 */

/** 1000 Zeichen je Nachricht — Grenze von `Game.notify`. */
export const NOTIFY_MAX_CHARS = 1000;
/** Höchstens 20 Nachrichten je Tick — Grenze von `Game.notify`. */
export const NOTIFY_MAX_PER_TICK = 20;

/** Länge des Präfixes `[i/n] ` bei gegebener Ziffernbreite von `n`. */
function prefixLength(digitWidth: number): number {
  // "[" + i + "/" + n + "] " = 4 feste Zeichen plus die Ziffern von i und n.
  // `i` ist nie breiter als `n` (i <= n), deshalb ist `digitWidth` für beide
  // eine sichere obere Schranke — die Reservierung ist damit nie zu knapp.
  return 4 + 2 * digitWidth;
}

/**
 * Zerlegt eine Zeilenliste gierig in Blöcke von höchstens `maxContentChars`
 * Zeichen. Eine einzelne Zeile, die selbst zu lang ist, wird hart in
 * gleich große Stücke geschnitten (eigene Blöcke, ohne Zusammenführung mit
 * Nachbarzeilen) — alles andere ließe einen unversendbaren Block entstehen.
 */
function greedySplitLines(lines: string[], maxContentChars: number): string[] {
  const blocks: string[] = [];
  let current = "";

  for (const line of lines) {
    if (line.length > maxContentChars) {
      if (current.length > 0) {
        blocks.push(current);
        current = "";
      }
      let rest = line;
      while (rest.length > 0) {
        blocks.push(rest.slice(0, maxContentChars));
        rest = rest.slice(maxContentChars);
      }
      continue;
    }

    const candidate = current.length === 0 ? line : `${current}\n${line}`;
    if (candidate.length <= maxContentChars) {
      current = candidate;
    } else {
      blocks.push(current);
      current = line;
    }
  }

  if (current.length > 0) blocks.push(current);
  return blocks;
}

/**
 * Zerlegt einen Bericht in versandfertige Blöcke, je mit Präfix `[i/n] `.
 * Rein und ohne Seiteneffekt, damit die Zerlegung testbar bleibt.
 *
 * Das Präfix zählt in die `maxChars` mit hinein. Weil die Ziffernbreite von
 * `n` erst nach der Zerlegung feststeht, läuft das in einer Fixpunktschleife:
 * mit einer angenommenen Breite zerlegen, die tatsächliche Blockzahl prüfen,
 * bei abweichender Breite mit der neuen Breite erneut zerlegen. Das
 * konvergiert in der Praxis nach ein bis zwei Durchläufen (die Breite wächst
 * je Durchlauf höchstens um eine Ziffer) und ist damit einfacher als eine
 * feste Reserve, die für sehr lange Berichte zu knapp werden könnte.
 */
export function splitForNotify(text: string, maxChars: number = NOTIFY_MAX_CHARS): string[] {
  if (text.trim().length === 0) return [];

  const lines = text.split("\n");

  let digitWidth = 1;
  let blocks: string[] = [];
  // Fünf Durchläufe sind reichlich: die Breite kann nur wachsen, und schon
  // ein Durchlauf mehr als nötig würde die Schleife per `break` verlassen.
  for (let iteration = 0; iteration < 5; iteration += 1) {
    const maxContentChars = Math.max(1, maxChars - prefixLength(digitWidth));
    blocks = greedySplitLines(lines, maxContentChars);

    const neededWidth = String(blocks.length).length;
    if (neededWidth === digitWidth) break;
    digitWidth = neededWidth;
  }

  const total = blocks.length;
  return blocks.map((block, index) => `[${index + 1}/${total}] ${block}`);
}

/**
 * Schickt `text` als E-Mail (unter `title` als Kopfzeile) über `Game.notify`.
 * Liefert die Meldung für die Konsole.
 */
export function mailReport(title: string, text: string): string {
  if (text.trim().length === 0) {
    return "Leerer Bericht, nichts verschickt.";
  }

  const blocks = splitForNotify(`${title}\n${text}`);
  if (blocks.length === 0) {
    return "Leerer Bericht, nichts verschickt.";
  }

  const toSend = blocks.slice(0, NOTIFY_MAX_PER_TICK);
  for (const block of toSend) {
    // groupInterval 0: sofort, nicht gruppiert — ein Bericht ist einmalig,
    // und `groupInterval` fasst nur *gleiche* Meldungen zusammen.
    Game.notify(block, 0);
  }

  const omitted = blocks.length - toSend.length;
  if (omitted > 0) {
    return `Bericht als ${toSend.length} E-Mail(s) verschickt, ${omitted} Block(e) weggelassen (Limit ${NOTIFY_MAX_PER_TICK} je Tick).`;
  }
  return `Bericht als ${toSend.length} E-Mail(s) verschickt.`;
}

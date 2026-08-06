/**
 * CPU-Stufen als **Ausfallsicherung**, nicht als Effizienzgewinn.
 *
 * Läuft alles normal, wird hier nichts abgeschaltet — bei vollem Bucket und
 * einem Tick weit unter dem Limit gibt es nichts zu sparen. Der Nutzen zeigt
 * sich genau dann, wenn es knapp wird: nach einem Angriff, bei vielen
 * gleichzeitigen Neuberechnungen, nach einem Global-Reset. Greift das CPU-Limit
 * mitten im Tick, bricht das Spiel den Rest **stillschweigend** ab — dann fällt
 * aus, was zufällig hinten steht, statt dessen, was am wenigsten wehtut.
 *
 * Drei Stufen (Plan 05, Befund 4):
 *
 * | Stufe | Inhalt | Darf ausfallen |
 * | --- | --- | --- |
 * | kritisch | Türme, Raum-Memory | nie — fragt hier gar nicht erst nach |
 * | normal | Spawncontroller, Verteidigungsscan | nur bei sehr niedrigem Bucket |
 * | niedrig | Statuslog, Terminal und Markt, Tagesjobs | zuerst |
 *
 * ## Warum die Schwellen so liegen
 *
 * Gemessen (`docs/profiler/`): **9,12 CPU je Tick** bei einem Limit von 20, der
 * teuerste einzelne Abschnitt 10,01. Der Bot ist also weit von der Grenze
 * entfernt, und eine Drossel, die im Normalbetrieb überhaupt etwas abschaltet,
 * wäre eine Verschlechterung ohne Gegenwert.
 *
 * Deshalb ist die **niedrige** Stufe an **zwei** Bedingungen geknüpft, die beide
 * zutreffen müssen: der laufende Tick hat sein Budget schon überschritten
 * (`getUsed() > limit`, greift bei 9 CPU nie) **und** der Bucket ist dünn. Eine
 * der beiden allein reicht nicht — insbesondere nicht der Bucket allein: er wird
 * regelmäßig von der Pixelerzeugung auf 0 gefahren (gemessenes Mittel 2043,
 * Minimum 1545), und das ist gewollt, kein Notstand. Eine reine Bucket-Schwelle
 * hätte Terminal und Markt nach jedem Pixel für hundert Ticks stillgelegt.
 *
 * Die **normale** Stufe hängt allein am Bucket, aber sehr tief: unter 500 ist
 * der Puffer wirklich weg, und dann ist ein ausgelassener Spawnversuch das
 * kleinere Übel gegenüber einem abgebrochenen Tick.
 *
 * `Game.cpu.limit` ist bewusst der Bezugswert und nicht `tickLimit`: `tickLimit`
 * enthält den Bucket und liegt deshalb fast immer bei 500, womit die Prüfung nie
 * anspräche. `limit` ist das, was der Tick verbrauchen darf, ohne den Puffer
 * anzugreifen.
 */

/** Bucketstand, unter dem die niedrige Stufe aussetzt — zusätzlich zum überzogenen Tick. */
const LOW_TIER_BUCKET = 2000;

/** Bucketstand, unter dem auch die normale Stufe aussetzt. Hier ist der Puffer wirklich weg. */
const NORMAL_TIER_BUCKET = 500;

/** Mindestabstand zwischen zwei Meldungen, damit ein Dauerzustand die Konsole nicht flutet. */
const LOG_INTERVAL = 100;

/** Tick der letzten Meldung je Stufe. Lebt im Modul; ein Global-Reset setzt ihn zurück. */
const lastReport: Record<string, number> = {};

/**
 * Meldet einen Ausfall, höchstens alle `LOG_INTERVAL` Ticks je Stufe.
 *
 * Ein Ausfall ist die Ausnahme und gehört sichtbar gemacht — aber ein
 * Dauerzustand darf die Konsole nicht unbrauchbar machen, und die Meldung selbst
 * kostet in einem Tick, der ohnehin knapp ist.
 */
function report(tier: string, reason: string): void {
  const last = lastReport[tier];
  if (last !== undefined && Game.time - last < LOG_INTERVAL) return;

  lastReport[tier] = Game.time;
  console.log(`[cpu] Stufe "${tier}" ausgelassen: ${reason}`);
}

/**
 * Darf die **niedrige** Stufe laufen? Statuslog, Terminal und Markt, Tagesjobs.
 *
 * Beide Bedingungen müssen für einen Ausfall zutreffen — siehe Dateikopf.
 */
export function mayRunLow(): boolean {
  const bucket = Game.cpu.bucket;
  if (bucket >= LOW_TIER_BUCKET) return true;

  const used = Game.cpu.getUsed();
  if (used <= Game.cpu.limit) return true;

  report("niedrig", `Bucket ${Math.round(bucket)}, im Tick schon ${used.toFixed(1)} von ${Game.cpu.limit}`);
  return false;
}

/**
 * Darf die **normale** Stufe laufen? Spawncontroller und Verteidigungsscan.
 *
 * Hängt allein am Bucket, und zwar sehr tief: ein ausgelassener Spawnversuch
 * kostet einen Tick, ein abgebrochener Tick kostet die Türme.
 */
export function mayRunNormal(): boolean {
  const bucket = Game.cpu.bucket;
  if (bucket >= NORMAL_TIER_BUCKET) return true;

  report("normal", `Bucket ${Math.round(bucket)} unter ${NORMAL_TIER_BUCKET}`);
  return false;
}

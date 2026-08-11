/**
 * Steht der Storage eines Raums unter Platzdruck?
 *
 * Eigenes Modul mit genau einer Frage, weil sie von zwei Seiten gestellt wird:
 * `controller/links.ts` entscheidet damit, ob der Storage-Link den
 * Controller-Link bedienungslos vollhält, und `roles/upgrader.ts` entscheidet
 * damit, ob trotz konfigurierter Null ein Upgrader gespawnt wird. Läge die
 * Funktion im Linkmodul, hinge der Upgrader wegen einer Storage-Frage am
 * Linkmodul.
 *
 * `controller/room-inventory.ts` ist bewusst nicht ihr Zuhause: dort stehen
 * unveränderliche Vorkommen (Quellen, Minerale), hier ein Wert, der sich jeden
 * Tick ändert.
 */

/**
 * Belegungsgrad, ab dem der Storage als "läuft über" gilt.
 *
 * Gemessen wird die **gesamte** Belegung und nicht nur die Energie — "der
 * Storage geht voll" ist eine Frage des Platzes, und das Einzige, was der Bot
 * dagegen tun kann, ist Energie in den Controller abzubauen.
 */
export const STORAGE_FULL_RATIO = 0.9;
export const STORAGE_EMPTY_RATIO = 0.01;

/**
 * Energieboden für den Überlauf.
 *
 * Ohne ihn löste ein Storage, der mit Mineralien vollsteht und wenig Energie
 * hält, eine ungedrosselte Upgraderei auf einem dünnen Energiebestand aus.
 *
 * Trägt dieselbe Zahl wie `RCL8_WORK_RESERVE` in `roles/upgrader.ts`, bleibt
 * aber bewusst eine eigene Konstante: die eine beantwortet "darf der
 * RCL8-Upgrader arbeiten", diese hier "darf der Storage seinen Link speisen".
 * Sie zusammenzulegen wäre eine Kopplung, die nur solange trägt, wie die Zahlen
 * zufällig gleich sind.
 */
export const STORAGE_FULL_MIN_ENERGY = 100000;
export const STORAGE_EMPTY_MIN_ENERGY = 10000;

/**
 * Läuft der Storage dieses Raums über?
 *
 * Ohne Sicht auf den Raum oder ohne Storage: `false`. Die Funktion wird aus dem
 * Spawncontroller heraus auch für Räume gefragt, die gerade nicht sichtbar
 * sind.
 */
export function storageIsFull(roomName: string): boolean {
  const storage = Game.rooms[roomName]?.storage;
  if (!storage) {
    return false;
  }

  const capacity = storage.store.getCapacity() ?? 0;
  if (capacity <= 0) {
    return false;
  }

  const used = storage.store.getUsedCapacity() ?? 0;

  // Beide Vergleiche positiv formuliert (siehe CLAUDE.md): fehlt ein Wert, ist
  // der Vergleich falsch, und das ist hier die sichere Seite.
  return used / capacity > STORAGE_FULL_RATIO && storage.store[RESOURCE_ENERGY] > STORAGE_FULL_MIN_ENERGY;
}

export function storageIsEmpty(roomName: string): boolean {
  const storage = Game.rooms[roomName]?.storage;
  if (!storage) {
    return false;
  }

  const capacity = storage.store.getCapacity() ?? 0;
  if (capacity <= 0) {
    return false;
  }

  const used = storage.store.getUsedCapacity() ?? 0;

  // Beide Vergleiche positiv formuliert (siehe CLAUDE.md): fehlt ein Wert, ist
  // der Vergleich falsch, und das ist hier die sichere Seite.
  return used / capacity < STORAGE_EMPTY_RATIO && storage.store[RESOURCE_ENERGY] < STORAGE_EMPTY_MIN_ENERGY;
}

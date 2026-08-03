/**
 * Wrapping-Mechanik des Profilers: ersetzt Rollen- und Klassenmethoden durch
 * messende Fassungen. Herkunft der Grundidee ist
 * `screepers/screeps-typescript-profiler` (`wrapFunction`); anders als dort
 * kommt der Zustand hier **nicht** je Aufruf aus `Memory`, sondern aus der
 * gespiegelten Modulvariable `getMode()` (siehe `./state`) — das war der
 * Hauptfehler des Originals. Die Zähler gehen an `./window`, nicht nach
 * `Memory`.
 */

import type { CreepRole } from "../roles";
import { getMode } from "./state";
import { recordRole, recordCreep } from "./window";

/**
 * Ersetzt `obj[key]` durch eine messende Fassung. Idempotent: ein zweiter
 * Aufruf für denselben Schlüssel erkennt den bereits gesicherten Original
 * (`savedName`) und tut nichts.
 *
 * Misst nur im Zustand `full`; in `off` und `light` läuft kein
 * `Game.cpu.getUsed()`, der Originalaufruf geht unverändert durch.
 */
export function wrapFunction(obj: object, key: PropertyKey, className?: string): void {
  const descriptor = Reflect.getOwnPropertyDescriptor(obj, key);
  if (!descriptor || descriptor.get || descriptor.set) {
    return;
  }
  if (key === "constructor") {
    return;
  }

  const originalFunction = descriptor.value;
  if (!originalFunction || typeof originalFunction !== "function") {
    return;
  }

  const resolvedClassName = className ?? (obj.constructor ? obj.constructor.name : "");
  const memKey = `${resolvedClassName}.${String(key)}`;
  const savedName = `__${String(key)}__`;
  if (Reflect.has(obj, savedName)) {
    return;
  }
  Reflect.set(obj, savedName, originalFunction);

  Reflect.set(obj, key, function (this: any, ...args: any[]) {
    if (getMode() !== "full") {
      return originalFunction.apply(this, args);
    }

    const start = Game.cpu.getUsed();
    const result = originalFunction.apply(this, args);
    recordRole(memKey, Game.cpu.getUsed() - start);
    return result;
  });
}

/** Dekorator für eine ganze Klasse. */
export function profile(target: Function): void;
/** Dekorator für eine einzelne Methode. */
export function profile(target: object, key: string | symbol, descriptor: TypedPropertyDescriptor<Function>): void;
/**
 * Kombinierter Klassen-/Methoden-Dekorator. Für den geplanten Umbau der
 * Rollen auf Klassen: der Verbuchungsschlüssel ist `<Klassenname>.<methode>`.
 * In Phase A noch ungenutzt — `wrapRoles` deckt die bestehende, funktionale
 * Rollentabelle ab.
 */
export function profile(
  target: object | Function,
  key?: string | symbol,
  _descriptor?: TypedPropertyDescriptor<Function>
): void {
  if (key === undefined) {
    // Klassen-Dekorator: alle eigenen Methoden des Prototyps umhüllen.
    const ctor = target as Function;
    const prototype = (ctor as { prototype: object }).prototype;
    for (const propertyKey of Object.getOwnPropertyNames(prototype)) {
      wrapFunction(prototype, propertyKey, ctor.name);
    }
    return;
  }

  // Methoden-Dekorator: bei statischen Methoden ist `target` der Konstruktor
  // selbst (eine Funktion), sonst der Prototyp der Instanz.
  const className = typeof target === "function" ? target.name : target.constructor.name;
  wrapFunction(target, key, className);
}

/**
 * Umhüllt die Rollentabelle und liefert eine neue Tabelle mit gemessenen
 * `doJob`/`spawn`. Die Rollentabelle selbst (`jobs`) bleibt unverändert.
 *
 * Rollen werden unter ihrem eigenen Namen verbucht, `spawn` zusätzlich unter
 * `<rolle>.spawn`. Läuft `doJob` im Zustand `full`, wird dieselbe Messung
 * auch je Creep verbucht (`recordCreep`) — ob daraus tatsächlich eine
 * Detailzeile wird, entscheidet `./window`, nicht dieser Wrapper.
 */
export function wrapRoles(jobs: Record<string, CreepRole>): Record<string, CreepRole> {
  const wrapped: Record<string, CreepRole> = {};

  // `for...in` erhält die Iterationsreihenfolge der Eingabetabelle
  // (Insertion-Order bei String-Schlüsseln): diese Reihenfolge *ist* die
  // Spawn-Priorität in `controller/spawn.ts` und darf nicht verändert werden.
  for (const role in jobs) {
    const original = jobs[role]!;

    wrapped[role] = {
      doJob(creep: Creep): void {
        if (getMode() !== "full") {
          original.doJob(creep);
          return;
        }

        const start = Game.cpu.getUsed();
        original.doJob(creep);
        const cpu = Game.cpu.getUsed() - start;
        recordRole(role, cpu);
        recordCreep(creep.name, cpu);
      },

      spawn(spawn: StructureSpawn, workroom: string): boolean {
        if (getMode() !== "full") {
          return original.spawn(spawn, workroom);
        }

        const start = Game.cpu.getUsed();
        const result = original.spawn(spawn, workroom);
        recordRole(`${role}.spawn`, Game.cpu.getUsed() - start);
        return result;
      },
    };
  }

  return wrapped;
}

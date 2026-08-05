/**
 * Zusammenbau des Profilers — die eine Stelle, an der seine Objekte entstehen.
 *
 * Warum eine eigene Datei und nicht `index.ts`: der Dekorator `@profile` steht an
 * den Rollenklassen und kann keine Argumente bekommen; er muss sich das Fenster
 * also selbst holen. Holte er es aus `index.ts`, entstünde eine Importschleife
 * (`index` → `decorator` → `index`). Diese Datei hängt an nichts außer den drei
 * Klassen und bricht sie damit auf.
 *
 * Abhängigkeitsrichtung, die nicht verletzt werden darf:
 *
 *     types  <-  state  <-  window  <-  runtime  <-  decorator
 *     types  <-  state  <-  flag    <-  runtime
 *     alle   <-  index
 */

import { FlagSwitch } from "./flag";
import { ProfilerState } from "./state";
import { MeasurementWindow } from "./window";

/** Zustand aus `Memory.profiler`: Zustandsschalter, Detailmessung, Grundlinien. */
export const state = new ProfilerState();

/** Das laufende Messfenster. Lebt im Heap und übersteht keinen Global-Reset. */
export const measurement = new MeasurementWindow(state);

/** Der Flaggen-Schalter samt Legende auf der Karte. */
export const flagSwitch = new FlagSwitch(state);

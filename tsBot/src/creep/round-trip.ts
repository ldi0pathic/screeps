/**
 * Gemessene Umlaufdimensionierung: aus tatsächlich gefahrenen Wegstrecken die
 * nötige Tragfähigkeit (und, falls eine nicht reicht, die nötige Creepzahl)
 * ableiten.
 *
 * Warum messen statt schätzen: der Durchsatz einer Quelle ist gedeckelt (siehe
 * `docs/knowledge/efficiency/energy-economy.md`, „Carry Throughput" —
 * 10 Energie/Tick für eine eigene oder reservierte Quelle), nicht die
 * Tragfähigkeit des Trägers. Ein zu groß gebauter Creep transportiert nicht
 * mehr Energie, er kostet nur zusätzliche Spawnticks. Die dortige Formel
 * `required CARRY = ceil(energy_per_tick * round_trip_ticks / 50)` ergibt für
 * eine eigene Quelle `ceil(10 * umlauf / 50) = ceil(umlauf / 5)`. Das hier
 * verwendete `ceil(2 * median / 5)` ist dieselbe Formel: `median` ist nur der
 * einfache Weg (eine Richtung), der Umlauf ist doppelt so lang, also
 * `2 * median` statt `round_trip_ticks`.
 *
 * Herkunft: `roles/debitor.ts` maß dies schon vor dieser Klasse als einziges
 * Modul im Bot (`Debitor.bodyFor`, Zweig „Arbeitsraum ist nicht der
 * Heimatraum", plus die beiden `checkHarvest`-Rückrufe in `Debitor.doJob`, die
 * die Werte sammelten). Diese Klasse holt die Logik nur heraus, ohne die
 * Arithmetik zu verändern — auch nicht ihre Eigenarten:
 *
 * - Der „Median" ist `sortiert[ceil(länge * 0.5)]`, kein echter Median (bei
 *   einer einzelnen Messung liegt der Index außerhalb des Arrays, das Ergebnis
 *   ist dann `undefined` und die Ableitung liefert `NaN` — der Aufrufer fängt
 *   das ab).
 * - `sort` verändert die Messreihe im Memory an Ort und Stelle.
 * - Die Messreihe wird erst bei mehr als 30 Werten festgeschrieben
 *   (`Memory[...][size]` gesetzt, `Memory[...][samples]` gelöscht); bis dahin
 *   wird bei jedem Aufruf neu aus den bisherigen Werten abgeleitet.
 *
 * Die Memory-Schlüssel (heute `distances`/`needDebitorSize`/`needDebitors` im
 * Raum-Memory) werden bewusst im Konstruktor übergeben statt fest eingebaut —
 * ein zweiter Nutzer (`transfer.ts`, siehe `docs/plans/03-durchsatz-und-bodies.md`)
 * bekommt so eigene Schlüssel, ohne dem Debitor seine wegzunehmen.
 */

/** Die drei Raum-Memory-Schlüssel, die eine `RoundTrip`-Instanz benutzt. */
export interface RoundTripKeys {
    /** Schlüssel der gesammelten Streckenmessungen (Array von Ticks je Weg). */
    samples: string;
    /** Schlüssel der festgeschriebenen Tragfähigkeit (CARRY-Paare je Creep). */
    size: string;
    /** Schlüssel der festgeschriebenen/abgeleiteten Creepzahl. */
    count: string;
}

/** Siehe Dateikopf. */
export class RoundTrip {
    constructor(private readonly workroom: string, private readonly keys: RoundTripKeys) { }

    /** Ob die Größe bereits festgeschrieben ist — ab dann werden keine neuen Messwerte mehr aufgenommen. */
    private get isFixed(): boolean {
        return !!Memory.rooms[this.workroom]![this.keys.size];
    }

    /** Die festgeschriebene Tragfähigkeit (CARRY-Paare), falls schon bekannt. */
    get size(): number | undefined {
        return Memory.rooms[this.workroom]![this.keys.size];
    }

    /** Die zuletzt abgeleitete bzw. festgeschriebene Creepzahl, falls schon bekannt. */
    get count(): number | undefined {
        return Memory.rooms[this.workroom]![this.keys.count];
    }

    /**
     * Nimmt eine gemessene Umlaufstrecke (ein Weg, nicht der ganze Umlauf) auf,
     * solange die Größe noch nicht feststeht. Liefert `true`, wenn der Wert
     * gespeichert wurde — der Aufrufer setzt dann sein eigenes
     * `creep.memory.distance` zurück auf 0 (das gehört dem Creep, nicht dieser
     * Klasse).
     */
    record(distance: number): boolean {
        if (this.isFixed)
            return false;

        if (!(distance > 0))
            return false;

        const room = Memory.rooms[this.workroom]!;
        if (!room[this.keys.samples])
            room[this.keys.samples] = [];

        room[this.keys.samples].push(distance);
        return true;
    }

    /**
     * Leitet aus den gesammelten Strecken die nötige Tragfähigkeit (CARRY-Paare
     * je Creep) ab. `maxSetsForEnergy` ist die maximal bezahlbare Satzzahl bei
     * der verfügbaren Energie (heute `BODIES.debitor.setsFor(...)`) — reicht ein
     * Creep für die errechnete Tragfähigkeit nicht, wird die Creepzahl
     * (`count`) erhöht und die Tragfähigkeit entsprechend geteilt.
     *
     * Ist die Größe schon festgeschrieben, wird nur ihr Wert zurückgegeben.
     * Stehen weder Festschreibung noch Messwerte zur Verfügung, liefert die
     * Methode `undefined`.
     */
    carryFor(maxSetsForEnergy: number): number | undefined {
        const room = Memory.rooms[this.workroom]!;
        let carry = room[this.keys.size];
        const distances = room[this.keys.samples];

        if (!carry && distances) {
            const length = Math.ceil(distances.length * 0.5);
            const median = distances.sort(function (a: any, b: any) {
                return a - b;
            })[length];
            carry = Math.ceil((2 * median) / 5);

            if (maxSetsForEnergy >= carry) {
                room[this.keys.count] = 1;
            }
            else {
                const count = room[this.keys.count] = Math.ceil(carry / maxSetsForEnergy);
                carry = Math.ceil(carry / count);
            }

            if (length > 30) {
                room[this.keys.size] = carry;
                delete room[this.keys.samples];
            }
        }

        return carry;
    }
}

/**
 * Statische Konfiguration des Bots. Das Modul wirkt ausschließlich über
 * Seiteneffekte: es füllt `global.*` und muss deshalb vor allen anderen
 * Modulen geladen werden (siehe `main.ts`).
 *
 * Inhaltlich identisch zu `prod/config.js`.
 */

import { bot, type RoomConfig, type TransferConfig } from "./globals";

const isString = (value: unknown): value is string => typeof value === "string";

bot.room = bot.room || {};
bot.prio = bot.prio || ({} as typeof bot.prio);
bot.const = bot.const || ({} as typeof bot.const);

bot.const = {
  maxRepairs: 5,
  logroom: "", //E59N3',//'E56N2'//'E59N4',
  showPaths: false,
};

bot.transfer = {
  /*E59N7:
  {
     room: 'E59N7',
     source: [
     //  'E59N9',
        'E58N7',
        'E58N6',
     ]
  },
  E56N2:
  {
     room: 'E56N2',
     source: [
        'E59N4',
        'E58N6',
        'E58N7',
     ]
  },
  E59N3:
  {
     room: 'E59N3',
     source: [
        'E59N4',

     ]
  },
 */
} satisfies Record<string, TransferConfig>;

bot.room = {
  E57N6: {
    room: "E57N6",
    spawnRoom: "E58N6",
    sendMiner: true,
    sendDebitor: true,
    sendFreeDebitor: false,
    sendBuilder: true,
    sendDefender: true,
    sendClaimer: true,

    //mining
    debitorProSource: 1,
    debitorAsFreelancer: 0,
    energySources: ["5bbcb07b9099fc012e63c406"],
    mineralSources: [],

    useLinks: false,
    targetLinks: [],
    spawnLink: null,
    controllerLink: null,

    //structures
    repairer: 0,
    maxwallRepairer: 0,
    maxbuilder: 1,
    prioBuildings: [],

    //controller
    upgrader: 0,
  },
  E58N4: {
    room: "E58N4",
    spawnRoom: "E59N4",
    sendMiner: true,
    sendDebitor: true,
    sendFreeDebitor: false,
    sendBuilder: false,
    sendDefender: true,
    sendClaimer: true,

    //mining
    debitorProSource: 1,
    debitorAsFreelancer: 0,
    energySources: ["5bbcb08d9099fc012e63c595"],
    mineralSources: [],
    useLinks: false,
    targetLinks: [],
    spawnLink: null,
    controllerLink: null,

    //structures
    repairer: 0,
    maxwallRepairer: 0,
    maxbuilder: 1,
    prioBuildings: [],
    destroy: ["63adb4b3aeebaa08e3aa2851"],

    //controller
    upgrader: 0,
  },
  E58N5: {
    room: "E58N5",
    spawnRoom: "E58N6",
    sendMiner: true,
    sendDebitor: true,
    sendFreeDebitor: false,
    sendBuilder: true,
    sendDefender: true,
    sendClaimer: true,

    //mining
    debitorProSource: 1,
    debitorAsFreelancer: 0,
    energySources: ["5bbcb08d9099fc012e63c593"],
    mineralSources: [],
    useLinks: false,
    targetLinks: [],
    spawnLink: null,
    controllerLink: null,

    //structures
    repairer: 0,
    maxwallRepairer: 0,
    maxbuilder: 1,
    prioBuildings: [],
    destroy: ["63542d26da5582631af71fcc", "6255d32e5fdb145fecd7d923"],

    //controller
    upgrader: 0,
  },
  E58N6: {
    room: "E58N6",
    spawnRoom: "E58N6",
    sendMiner: true,
    sendDebitor: true,
    minHostile: 2,
    sendFreeDebitor: true,
    sendBuilder: true,
    sendDefender: true,
    sendClaimer: false,
    // Muss an sein, solange `useLinks` gilt: seit dem Entfernen von
    // `harvestSpawnLink` leert niemand sonst den Link in der Basis, und ein
    // voller Empfänger-Link blockiert alle Quell-Links, die auf ihn senden.
    sendLinkkeeper: true,

    saveRoads: true,

    //mining
    debitorProSource: 1,
    debitorAsFreelancer: 1,
    energySources: ["5bbcb08d9099fc012e63c58f", "5bbcb08d9099fc012e63c590"],
    mineralSources: ["5bbcb72cd867df5e54207db1"],

    useLinks: true,
    targetLinks: ["653aed0d2fa32d1c887ab4e7", "657f0915dbc7505af702443c"],
    spawnLink: "657f0915dbc7505af702443c",
    controllerLink: "653aed0d2fa32d1c887ab4e7",

    //structures
    repairer: 0,
    maxwallRepairer: 1,
    maxbuilder: 1,
    prioBuildings: [],

    //controller
    upgrader: 1,
  },
  E58N7: {
    room: "E58N7",
    spawnRoom: "E58N7",
    sendMiner: true,
    sendDebitor: true,
    minHostile: 2,
    sendFreeDebitor: true,
    sendBuilder: true,
    sendDefender: true,
    sendClaimer: false,
    // Muss an sein, solange `useLinks` gilt: seit dem Entfernen von
    // `harvestSpawnLink` leert niemand sonst den Link in der Basis, und ein
    // voller Empfänger-Link blockiert alle Quell-Links, die auf ihn senden.
    sendLinkkeeper: true,

    saveRoads: true,

    //mining
    debitorProSource: 0,
    debitorAsFreelancer: 1,
    energySources: ["5bbcb08d9099fc012e63c58c", "5bbcb08d9099fc012e63c58a"],
    mineralSources: ["5bbcb72cd867df5e54207db0"],
    mineralContainerId: "658f0b73615ae9c2e4995fb6",

    useLinks: true,
    targetLinks: ["655269336b163b788bbbaec1", "65380c0c74becf6de75f0370"],
    spawnLink: "655269336b163b788bbbaec1",
    controllerLink: "65380c0c74becf6de75f0370",

    //structures
    repairer: 0,
    maxwallRepairer: 1,
    maxbuilder: 2,
    prioBuildings: [],

    //controller
    upgrader: 1,
  },
  E58N8: {
    room: "E58N8",
    spawnRoom: "E59N9",
    sendMiner: true,
    sendDebitor: true,
    sendFreeDebitor: false,
    sendBuilder: true,
    sendDefender: true,
    sendClaimer: true,

    //mining
    debitorProSource: 2,
    debitorAsFreelancer: 0,
    energySources: ["5bbcb08d9099fc012e63c588"],
    mineralSources: [],

    useLinks: false,
    targetLinks: [],
    spawnLink: null,
    controllerLink: null,

    //structures
    repairer: 0,
    maxwallRepairer: 0,
    maxbuilder: 1,
    prioBuildings: [],
    walls: [],

    //controller
    upgrader: 0,
  },
  E59N3: {
    room: "E59N3",
    spawnRoom: "E59N3",
    transferEnergie: true,
    sendMiner: true,
    sendDebitor: true,
    sendFreeDebitor: true,
    sendBuilder: true,
    sendDefender: true,
    sendClaimer: false,
    // Muss an sein, solange `useLinks` gilt: seit dem Entfernen von
    // `harvestSpawnLink` leert niemand sonst den Link in der Basis, und ein
    // voller Empfänger-Link blockiert alle Quell-Links, die auf ihn senden.
    sendLinkkeeper: true,

    saveRoads: true,

    //mining
    debitorProSource: 1,
    debitorAsFreelancer: 1,
    energySources: ["5bbcb09f9099fc012e63c71f", "5bbcb09f9099fc012e63c71d"],
    mineralSources: ["5bbcb73ad867df5e54207e20"],
    mineralContainerId: null,
    useLinks: true,
    targetLinks: ["6666029dda8491c8c7f5b5f8", "65ad15e5e25690e38e742550"],
    spawnLink: "65ad15e5e25690e38e742550",
    controllerLink: "6666029dda8491c8c7f5b5f8",

    //structures
    repairer: 0,
    maxwallRepairer: 2,
    maxbuilder: 2,
    prioBuildings: [],

    //controller
    upgrader: 2,
  },

  E59N7: {
    room: "E59N7",
    spawnRoom: "E58N7",
    sendMiner: true,
    sendDebitor: true,
    sendFreeDebitor: false,
    sendBuilder: false,
    sendDefender: true,
    sendClaimer: true,

    //mining
    debitorProSource: 0,
    debitorAsFreelancer: 0,
    energySources: ["5bbcb09e9099fc012e63c711"],
    mineralSources: ["5bbcb739d867df5e54207e1c"],

    useLinks: false,
    targetLinks: [],
    spawnLink: null,
    controllerLink: null,

    //structures
    repairer: 0,
    maxwallRepairer: 0,
    maxbuilder: 1,
    prioBuildings: [],

    //controller
    upgrader: 0,
  },
  E59N8: {
    room: "E59N8",
    spawnRoom: "E59N9",
    sendMiner: true,
    sendDebitor: true,
    sendFreeDebitor: false,
    sendBuilder: true,
    sendDefender: true,
    sendClaimer: true,

    //mining
    debitorProSource: 2,
    debitorAsFreelancer: 0,
    energySources: ["5bbcb09e9099fc012e63c70e"],
    mineralSources: [],

    useLinks: false,
    targetLinks: [],
    spawnLink: null,
    controllerLink: null,

    //structures
    repairer: 0,
    maxwallRepairer: 0,
    maxbuilder: 1,
    prioBuildings: ["64faa4011ae98a0ce014fda8", "64fb3dc4b140246d9bd1f0dd"],

    //controller
    upgrader: 0,
  },
  E59N9: {
    room: "E59N9",
    spawnRoom: "E59N9",
    sendMiner: true,
    sendDebitor: true,
    minHostile: 2,
    sendFreeDebitor: true,
    sendBuilder: true,
    sendDefender: true,
    sendClaimer: false,
    // Muss an sein, solange `useLinks` gilt: seit dem Entfernen von
    // `harvestSpawnLink` leert niemand sonst den Link in der Basis, und ein
    // voller Empfänger-Link blockiert alle Quell-Links, die auf ihn senden.
    sendLinkkeeper: true,

    saveRoads: true,

    //mining
    debitorProSource: 0,
    debitorAsFreelancer: 1,
    energySources: ["5bbcb09e9099fc012e63c70a", "5bbcb09e9099fc012e63c70b"],
    mineralSources: ["5bbcb739d867df5e54207e1a"],

    useLinks: true,
    targetLinks: ["655261fc8c582e53825955a1", "65354f9aade2340fef294995"],
    spawnLink: "655261fc8c582e53825955a1",
    controllerLink: "65354f9aade2340fef294995",

    //structures
    repairer: 0,
    maxwallRepairer: 1,
    maxbuilder: 3,
    prioBuildings: [],
    //controller
    upgrader: 1,
  },
} satisfies Record<string, RoomConfig>;

bot.prio = {
  build: {
    [STRUCTURE_RAMPART]: 3,
    [STRUCTURE_WALL]: 3,
    [STRUCTURE_EXTENSION]: 1,
    [STRUCTURE_SPAWN]: 1,
    [STRUCTURE_TOWER]: 2,
    [STRUCTURE_CONTAINER]: 3,
    [STRUCTURE_LINK]: 1,
    [STRUCTURE_STORAGE]: 1,
    [STRUCTURE_LAB]: 4,
    [STRUCTURE_ROAD]: 5,
  },
  repair: {
    // Ramparts zerfallen dauerhaft (300 Hits je 100 Ticks) und schützen die
    // Strukturen darunter; Walls zerfallen überhaupt nicht. Deshalb steht der
    // Rampart vor der Wall — vorher war er mit 7 die schlechteste Priorität,
    // schlechter noch als die Straße.
    [STRUCTURE_RAMPART]: 1,
    [STRUCTURE_WALL]: 2,
    [STRUCTURE_EXTENSION]: 2,
    [STRUCTURE_SPAWN]: 2,
    [STRUCTURE_TOWER]: 3,
    [STRUCTURE_STORAGE]: 4,
    [STRUCTURE_CONTAINER]: 5,
    [STRUCTURE_ROAD]: 6,
  },
  hits: {
    [STRUCTURE_TOWER]: 0.75,
    [STRUCTURE_STORAGE]: 0.75,
    [STRUCTURE_CONTAINER]: 0.75,
    [STRUCTURE_WALL]: 0.0005,
    [STRUCTURE_RAMPART]: 0.001,
    [STRUCTURE_ROAD]: 0.75,
  },
};

bot.log = function (bool: boolean, msg: unknown): void {
  if (bool && isString(msg)) {
    console.log(msg);
  } else if (bool) {
    console.log(JSON.stringify(msg));
  }
};

bot.logWorkroom = function (room: string, msg: string): void {
  bot.log(bot.const.logroom == room, "[" + room + "] " + msg);
};

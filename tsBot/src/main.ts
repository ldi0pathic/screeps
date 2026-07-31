export function loop() {
  // Your Screeps code here
  console.log(`Current game tick is ${Game.time}`);

  for (const name in Game.creeps) {
    const creep = Game.creeps[name];
    if (creep.memory.role === "harvester") {
      // Example creep logic
    }
  }
}

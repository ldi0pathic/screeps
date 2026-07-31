module.exports = function () {
    const orgWithdraw = Creep.prototype.withdraw;
    const orgPickup = Creep.prototype.pickup;
    const orgHarvest = Creep.prototype.harvest;
    const orgMove = Creep.prototype.move;

    /**
     * 
     * @returns bool
     */
    Creep.prototype.withdraw = function (target, resourceType, amount) {
        if (target) {
            return orgWithdraw.call(this, target, resourceType, amount);
        }

        if (this.memory.withdraw) {

            var withdraw = Game.getObjectById(this.memory.withdraw);
            var inRange = withdraw && this.pos.inRangeTo(withdraw, 1);

            if (withdraw && inRange) {
                switch (orgWithdraw.call(this, withdraw, this.memory.resourceType || RESOURCE_ENERGY)) {
                    case ERR_NOT_IN_RANGE:
                        this.move(withdraw.pos);
                        return true;

                    case OK:
                        this.memory.fromId = withdraw.id;
                        return true;

                    case ERR_INVALID_TARGET:
                    default:
                        delete this.memory.withdraw;
                        return false;
                }
            }
            else if (withdraw && !inRange) {
                if (withdraw.store.getUsedCapacity() < 10) {
                    delete this.memory.withdraw;
                    return false;
                }

                return this.move(withdraw.pos);
            }
            delete this.memory.withdraw;
        }
        return false;
    };

    /**
     * 
     * @returns bool
     */
    Creep.prototype.pickup = function (target) {
        if (target) {
            return orgPickup.call(this, target);
        }

        if (this.memory.pickup) {

            var pickup = Game.getObjectById(this.memory.pickup);
            var inRange = pickup && this.pos.inRangeTo(pickup, 1);

            if (pickup && inRange) {
                switch (orgPickup.call(this, pickup)) {
                    case ERR_NOT_IN_RANGE:
                        this.move(pickup.pos);
                        return true;

                    case OK:
                        this.memory.fromId = pickup.id;
                        return true;

                    case ERR_INVALID_TARGET:
                    default:
                        delete this.memory.pickup;
                        return false;
                }
            }
            else if (pickup && !inRange) {
                if (pickup.amount < 10) {
                    delete this.memory.pickup;
                    return false;
                }
                return this.move(pickup.pos);
            }
            delete this.memory.pickup;
        }
        return false;
    };

    /**
    * 
    * @returns bool
    */
    Creep.prototype.harvest = function (target) {
        if (target) {
            return orgHarvest.call(this, target);
        }

        if (typeof this.memory.harvest === 'string') {

            var harvest = Game.getObjectById(this.memory.harvest);
            var inRange = harvest && this.pos.inRangeTo(harvest, 1);

            if (harvest && inRange) {
                switch (orgHarvest.call(this, harvest)) {
                    case ERR_NOT_IN_RANGE:
                        this.move(harvest.pos);
                        return true;

                    case OK:
                        this.memory.fromId = harvest.id;
                        return true;

                    case ERR_INVALID_TARGET:
                    default:
                        delete this.memory.harvest;
                        return false;
                }
            }
            else if (harvest && !inRange) {
                if (harvest.energy && harvest.energy <= 1 || 
                    harvest.mineralAmount && harvest.mineralAmount < 1) {
                    delete this.memory.harvest;
                    return false;
                }
                return this.move(harvest.pos);
            }
            delete this.memory.harvest;
        }
        return false;
    };

    /**
     * 
     * @param {RoomPosition} target 
     * @returns bool
     */
    Creep.prototype.move = function (target) {
        if (typeof target === 'number') {
            return orgMove.call(this, target);
        }

        if (!target) {
            return ERR_INVALID_ARGS;
        }

        if (this.pos.isEqualTo(target)) {
            delete this.memory.path;
            delete this.memory.pathTarget;
            delete this.memory.dontMove;
            delete this.memory.lastPos;
            return false;
        }

        if (this.memory.dontMove > 3) {
            var path = this.pos.findPathTo(target, { ignoreCreeps: false });
            var serializedPath = Room.serializePath(path);
            this.memory.path = serializedPath;

            this.memory.dontMove = 0;

            return true;
        }

        var serializedPath;
        var t = this.memory.pathTarget;
        var p = this.memory.path;

        if (p && t && t.roomName && target.isEqualTo(new RoomPosition(t.x, t.y, t.roomName))) {
            serializedPath = p;
        }
        else {
            var path = this.pos.findPathTo(target, { ignoreCreeps: true });
            serializedPath = Room.serializePath(path);
            this.memory.path = serializedPath;

            this.memory.pathTarget = {};
            this.memory.pathTarget.x = target.x;
            this.memory.pathTarget.y = target.y;
            this.memory.pathTarget.roomName = target.roomName;
        }

        var state = this.moveByPath(serializedPath);

        switch (state) {
            case OK:
            case ERR_TIRED:
                {
                    if (this.memory.lastPos && this.memory.lastPos.x == this.pos.x && this.memory.lastPos.y == this.pos.y) {
                        this.memory.dontMove = this.memory.dontMove + 1;
                    }
                    else {
                        this.memory.lastPos = {};
                        this.memory.lastPos.x = this.pos.x;
                        this.memory.lastPos.y = this.pos.y;
                    }

                    return true;
                }

            case ERR_INVALID_ARGS:
            case ERR_NO_BODYPART:
            case ERR_NOT_FOUND:
                {
                    delete this.memory.path;
                    delete this.memory.pathTarget;
                    delete this.memory.dontMove;
                    delete this.memory.lastPos;
                    return true; //damit er sein script für diesen Tick beendet
                }

            default:
                return false;
        }
    }
};

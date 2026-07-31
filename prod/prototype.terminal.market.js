module.exports = function () {
    function getFallbackPrice(resource) {

        if (T1_BOOSTS[resource]) {
            return 0.001; // praktisch geschenkt
        }

        if (T1_INTERMEDIATES[resource]) {
            return 0.001; // praktisch geschenkt
        }
        
        const history = Game.market.getHistory(resource);
        if (!history || !history.length) return null;

        const avg = history.reduce((s, h) => s + h.avgPrice, 0) / history.length;
        return avg * 0.7;
    }
    const T1_BOOSTS = {
        UH2O: true,
        UHO2: true,
        KH2O: true,
        KHO2: true,
        ZH2O: true,
        ZHO2: true,
        LH2O: true,
        LHO2: true,
        GH2O: true,
        GHO2: true
    };
    const T1_INTERMEDIATES = {
        UH: true,
        UO: true,
        KH: true,
        KO: true,
        ZH: true,
        ZO: true,
        LH: true,
        LO: true,
        GH: true,
        GO: true
    };
    const NEVER_SELL = {
        "energy": true,
        "power": true,
        "pixel": true,
        "XUH2O": true,
        "XUHO2": true,
        "XKHO2": true,
        "XKH2O": true,
        "XZH2O": true,
        "XZHO2": true,
        "XLH2O": true,
        "XLHO2": true,
        "XGH2O": true,
        "XGHO2": true
    };
    
    StructureTerminal.prototype.sell = function(){
        if(this.cooldown > 1)
            return;

        var terminalEnergy = this.store.getUsedCapacity(RESOURCE_ENERGY)

        if(terminalEnergy < 1000 || terminalEnergy >= this.store.getUsedCapacity())
            return;

        for(var resource in this.store)
        {
            if (NEVER_SELL[resource]) continue;
            
            var minPrice = getFallbackPrice(resource);
           if (!minPrice) 
                continue;
            
            var orders = Game.market.getAllOrders({type: ORDER_BUY, resourceType: resource});

            var marketOrdersWithDistances = orders.filter(o => o.price >= minPrice)
            .map(order => {
                var distance = this.pos.getRangeTo(new RoomPosition(25, 25, order.roomName));
                return {
                    order,
                    distance
                };
            }).sort((a, b) => a.distance - b.distance);

            var capa = this.store.getUsedCapacity(resource);
            for(let i = 0; i< marketOrdersWithDistances.length; i++) 
            {
                var order = marketOrdersWithDistances[i].order;
                var amount = order.amount > capa ? capa : order.amount;   
                var transferEnergyCost = Game.market.calcTransactionCost( amount, this.room.name, order.roomName);

                var costPerRes = transferEnergyCost / amount;
                if( costPerRes < 0.789)
                {
                    if(transferEnergyCost > terminalEnergy)
                        amount = Math.floor(terminalEnergy / costPerRes);

                    if (OK == Game.market.deal(order.id, amount, this.room.name))
                    {
                        console.log('['+this.room.name+'] '+ resource+' verkauft: ' + amount + ' zu '+order.price);
                        return;
                    } 
                }  
            }
        }
    };
    StructureTerminal.prototype.buy = function(){
        if(this.cooldown > 1)
            return;

        var terminalEnergy = this.store.getUsedCapacity(RESOURCE_ENERGY)

        if(terminalEnergy < 1000 || this.store.getFreeCapacity() <= 10)
            return;

        for(var resource in global.maxOrderPrice)
        {
            const orders = Game.market.getAllOrders({
                type: ORDER_SELL,
                resourceType: resource
            });

            const valid = orders.filter(o => o.roomName)
                .map(o => {
                    const energyCost = Game.market.calcTransactionCost(
                        1,
                        this.room.name,
                        o.roomName
                    );
                    return { o, energyCost };
                })
                .filter(x =>
                    x.o.price <= global.maxOrderPrice[resource] &&
                    x.energyCost <= 5000
                )
                .sort((a, b) => a.o.price - b.o.price);

            if (!valid.length) return;

            const order = valid[0].o;
            const amount = Math.min(
                50,
                order.amount,
                Math.floor(Game.market.credits / order.price)
            );

            if (amount <= 0) return;

            if (OK === Game.market.deal(order.id, amount, this.room.name)) {
                console.log(`[${this.room.name}] Pixel gekauft: ${amount} zu ${order.price}`);
            }
            
        }
    };
    StructureTerminal.prototype.buyPixel = function() {
        if (this.cooldown > 1) return;

        const terminalEnergy = this.store.getUsedCapacity("energy");
        const freeCapacity = this.store.getFreeCapacity();

        if (terminalEnergy < 1000 || freeCapacity <= 10) return;

        const resource = "pixel"; // <-- hier den String verwenden

        // fairer Preis anhand Markt-Historie
        const marketHistory = Game.market.getHistory(resource);
        if (!marketHistory || !marketHistory.length) return;

        const avgPrice = marketHistory.reduce((sum, h) => sum + h.avgPrice, 0) / marketHistory.length;
        const fairPrice = Math.floor(avgPrice * 1.1); // 5% über Marktavg

        const orders = Game.market.getAllOrders({ type: ORDER_SELL, resourceType: resource });
        if (!orders.length) return;

        const valid = orders
            .filter(o => o.roomName)
            .map(o => {
                const energyCost = Game.market.calcTransactionCost(1, this.room.name, o.roomName);
                const effectivePrice = o.price + (energyCost / Math.min(o.amount, 50));
                return { o, energyCost, effectivePrice };
            })
            .filter(x => x.effectivePrice <= fairPrice && x.energyCost <= terminalEnergy)
            .sort((a, b) => a.effectivePrice - b.effectivePrice);

        if (!valid.length) return;

        const order = valid[0].o;
        const amount = Math.min(
            50,
            order.amount,
            Math.floor(Game.market.credits / order.price),
            Math.floor(terminalEnergy / Game.market.calcTransactionCost(1, this.room.name, order.roomName))
        );

        if (amount <= 0) return;

        if (OK === Game.market.deal(order.id, amount, this.room.name)) {
            console.log(`[${this.room.name}] Pixel Sniper: ${amount} zu ${order.price} (effektiv inkl. Energie: ${valid[0].effectivePrice.toFixed(2)})`);
        }
    };

}


'use strict';

function triggerMblockEvent(miner) {
    var event = new CustomEvent('minerBlocked', {
        detail: {
            minerUrl: miner
        }
    });
    document.dispatchEvent(event);
}

setTimeout(function () {
    for (var name in this) {

        if (name === 'webkitStorageInfo') {
            continue;
        }

        try {

            if (this[name] &&
                typeof this[name] !== 'undefined' &&
                typeof this[name].isRunning === 'function' &&
                typeof this[name].stop === 'function' &&
                typeof this[name]._siteKey === 'string'
            ) {
                console.log('[+] Coinhive miner found, stopping...');
                this[name].stop();
                this[name] = null;
                triggerMblockEvent('CoinHive (inline)');
            }

            if (this[name] &&
                typeof this[name] !== 'undefined' &&
                typeof this[name].db === 'function' &&
                typeof this[name].getlf === 'function' &&
                typeof this[name].stop === 'function' &&
                typeof this[name].hps === 'function'
            ) {
                console.log('[+] Mineralt miner found, stopping...');
                this[name].stop();
                this[name] = null;
                triggerMblockEvent('Mineralt (inline)');
            }

        } catch (mkerr) {
        }
    }
}, 2000);
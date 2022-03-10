
module.exports = {
  async connectKeplrSuggest(dataChain) {
    //console.log(dataChain)
    if (!window.getOfflineSigner || !window.keplr) {
        alert("Please install keplr extension");
    } else {
        if (window.keplr.experimentalSuggestChain) {
            try {

                await window.keplr.experimentalSuggestChain({
                chainId: dataChain.chainId,
                chainName: dataChain.name,
                rpc: dataChain.rpcURL,
                rest: dataChain.apiURL,
                stakeCurrency: {
                  coinDenom: dataChain.coinLookup.viewDenom,
                  coinMinimalDenom: dataChain.coinLookup.chainDenom,
                  coinDecimals: 6,
                },
                bip44: {
                  coinType: 118,
                },
                bech32Config: {
                  bech32PrefixAccAddr: dataChain.coinLookup.addressPrefix,
                  bech32PrefixAccPub: dataChain.coinLookup.addressPrefix + "pub",
                  bech32PrefixValAddr: dataChain.coinLookup.addressPrefix + "valoper",
                  bech32PrefixValPub: dataChain.coinLookup.addressPrefix + "valoperpub",
                  bech32PrefixConsAddr: dataChain.coinLookup.addressPrefix + "valcons",
                  bech32PrefixConsPub: dataChain.coinLookup.addressPrefix + "valconspub"
                },
                currencies: [{
                  coinDenom: dataChain.coinLookup.viewDenom,
                  coinMinimalDenom: dataChain.coinLookup.chainDenom,
                  coinDecimals: 6,
                }],
                feeCurrencies: [{
                  coinDenom: dataChain.coinLookup.viewDenom,
                  coinMinimalDenom: dataChain.coinLookup.chainDenom,
                  coinDecimals: 6,
                  }],
                  coinType: 118,
                  gasPriceStep: {
                    low: 0.01,
                    average: 0.025,
                    high: 0.04
                  }
                });
            } catch {
                alert("Failed to suggest the chain");
            }
        } else {
            alert("Please use the recent version of keplr extension");
        }
    }

    await window.keplr.enable(dataChain.chainId);
    const offlineSigner = window.getOfflineSigner(dataChain.chainId);
    const accounts = await offlineSigner.getAccounts();
    //console.log(accounts)
    return accounts
  },
}


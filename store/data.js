import axios from 'axios'
import cosmos from 'cosmos-lib'
import cosmosConfig from '~/cosmos.config'

export const state = () => ({
  block: undefined,
  chainId: 0,
  balances: [],
  balancesLoaded: false,
  rewards: [],
  rewardsLoaded: false,
  delegations: [],
  delegationsLoaded: false,
  undelegations: [],
  undelegationsLoaded: false,
  validators: [],
  validatorsLoaded: false,
  proposals: [],
  proposal: [],
  proposalLoaded: false,
  isValidator: false,
  allWallet: [],
  allWalletLoaded: false,
  allCommissions: [],
})

export const mutations = {
  // create set methods from data points
  ...Object.fromEntries(
    Object.keys(state()).map((entity) => {
      return [
        `set${entity.charAt(0).toUpperCase()}${entity.substr(1)}`,
        (state, value) => {
          state[entity] = value
        },
      ]
    })
  ),
  resetSessionData(state) {
    state.balances = []
    state.rewards = []
    state.delegations = []
    state.undelegations = []
    state.rewards = []
    state.transactions = []
  },
}

export const actions = {
  init({ commit }) {
    commit('setApi', new DataSource(this.$axios, network))
  },
  // this is never awaited in the code
  async refresh({ dispatch, state }, address) {
     console.log(address)
    const calls = [
      dispatch('getWalletInfo', address),
      dispatch('getDelegations', address),
      dispatch('getAllProposals'),

    ]
    await Promise.all(calls)
  },

  async getWalletInfo({ commit, state }, address) {
    const accountInfo = await axios(cosmosConfig[state.chainId].apiURL + `/bank/balances/` + address)
    const foundAccountInfo = accountInfo.data.result.find(element => element.denom === cosmosConfig[state.chainId].coinLookup.chainDenom)

    if(typeof foundAccountInfo === 'undefined') {
      var amount = 0
    } else
      var amount = Number(foundAccountInfo.amount)

    commit('setBalances', amount)
    return accountInfo
  },

  async checkIsValidator({ commit, state }, valAddress) {
    let apiRes = null;
    apiRes = await axios(cosmosConfig[state.chainId].apiURL + `/cosmos/staking/v1beta1/validators/` + valAddress)
    .then(response => {
      //console.log(response)
      commit('setIsValidator', true)
      //
    })
    .catch(error => {
        //console.log(error.response)
        commit('setIsValidator', false)
    });
  },

  async getDelegations({ commit, state }, address) {
    const getDelegations = await axios(cosmosConfig[state.chainId].apiURL + `/cosmos/distribution/v1beta1/delegators/` + address + `/rewards`)
    let foundMainDenom = getDelegations.data.total.find(element => element.denom === cosmosConfig[state.chainId].coinLookup.chainDenom);
    if (typeof foundMainDenom === 'undefined') {
      foundMainDenom = {
        denom: cosmosConfig[state.chainId].coinLookup.chainDenom,
        amount: '0'
      }
    }
    var copieRewards = [];
    //console.log(denomId)
    if (cosmosConfig[state.chainId].name === 'MicroTick') {
      var denomId = 1
    } else {
      var denomId = 0
    }


    const getValidatorInfo = await axios(cosmosConfig[state.chainId].apiURL + `/staking/delegators/` + address + `/delegations`)
    const getValidatorMainInfo = await axios(cosmosConfig[state.chainId].apiURL + `/cosmos/staking/v1beta1/validators?pagination.limit=200`)

    await getDelegations.data.rewards.forEach(function(item){
      let foundDelegByValidator = getValidatorInfo.data.result.find(element => element.delegation.validator_address === item.validator_address);
      let foundValidatorMainInfo = getValidatorMainInfo.data.validators.find(element => element.operator_address === item.validator_address);

      //console.log(getValidatorMainInfo.data.validators.length)
      copieRewards.push({
        validatorName: foundValidatorMainInfo?.description.moniker,
        op_address: foundDelegByValidator.delegation.validator_address,
        reward: item.reward[denomId]?.amount,
        share: foundDelegByValidator.delegation.shares
      });
    });
    // console.log(copieRewards)

    commit('setDelegations', copieRewards)
    commit('setRewards', foundMainDenom)
    commit('setDelegationsLoaded', true)
  },

  async getAllValidators({ commit, state }) {
    var copieValidators = [];
    const allValidators = await axios(cosmosConfig[0].apiURL + `/staking/validators`)
    // await allValidators.data.result.forEach(function(item){
    await Promise.all(allValidators.data.result.map(async (item) => {

      /*var validatorAvatar = await fetch(
        'https://keybase.io/_/api/1.0/user/lookup.json?fields=pictures&key_suffix=' + item.description.identity
        ).then(res => res.json())
        //console.log(validatorAvatar)
      if (!validatorAvatar.them) {
        validatorAvatar = cosmosConfig[state.chainId].coinLookup.icon
      } else {
        validatorAvatar = validatorAvatar.them[0].pictures.primary.url
      } */

      copieValidators.push({
        name: item.description.moniker,
        op_address: item.operator_address,
        crate: (Number(item.commission.commission_rates.rate) * 100).toFixed(2),
        website: item.description.website,
        // avatar: validatorAvatar
      });
    }));

    commit('setValidators', copieValidators)
    commit('setValidatorsLoaded', true)
  },

  async getAllProposals({ commit, state }) {
    const allProposals = await axios(cosmosConfig[state.chainId].apiURL + `/cosmos/gov/v1beta1/proposals`)
    //console.log(allProposals.data.proposals)
    commit('setProposals', allProposals.data.proposals.reverse())
  },

  async getSingleProposal({ commit, state }, proposalId) {
    const allProposals = await axios(cosmosConfig[state.chainId].apiURL + `/cosmos/gov/v1beta1/proposals/` + proposalId)
    // console.log(allProposals.data.proposal)
    commit('setProposal', allProposals.data.proposal)
    commit('setProposalLoaded', true)
  },

  async getAllCommissions({ commit, state }, addVal) {
    // var copieValidators = [];
    const allCommissions = await axios(cosmosConfig[state.chainId].apiURL + `/cosmos/tx/v1beta1/txs?events=message.sender=%27`+addVal+`%27&events=message.action=%27/cosmos.distribution.v1beta1.MsgWithdrawValidatorCommission%27`)

    //console.log(allCommissions)
    /*await allValidators.data.result.forEach(function(item){
      copieValidators.push({
        name: item.description.moniker,
        op_address: item.operator_address,
        crate: (Number(item.commission.commission_rates.rate) * 100).toFixed(2)
      });
    });*/

   commit('setAllCommissions', allCommissions.data.tx_responses)
  },

  async getAllAddressData({ commit, state }, data) {

    /*const allProposals = await axios(cosmosConfig[state.chainId].apiURL + `/cosmos/gov/v1beta1/proposals/` + proposalId)*/

    commit('setAllWallet', data)
    //commit('setAllWalletLoaded', true)
  },

  changeChaniId({ commit }, chainId) {
    commit('setChainId', chainId)
  },
  resetSessionData({ commit }) {
    commit('resetSessionData')
  },
}

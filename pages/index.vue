<template>
  <v-app id="inspire">
    <v-app-bar
      app
      color="white"
      flat
    >
      <v-container class="py-0 fill-height">
        <v-avatar

          class="mr-10"
          color="grey darken-1"
          size="32"
        >
          <img
            :src="cosmosConfig[0].coinLookup.icon"
            alt="cerberus"
          >
        </v-avatar>

        <v-btn
          v-for="link in links"
          :key="link.link"
          text
          :to="link.link"
        >
          {{ link.name }}
        </v-btn>

        <v-spacer></v-spacer>
    <v-progress-circular
      v-if="logged"
      :rotate="360"
      :size="20"
      :width="5"
      :value="timerValue"
      color="amber"
      class="mr-4"
    >
 
    </v-progress-circular>        
          <v-btn v-if="!logged" elevation="4" depressed v-on:click="connectKeplr">
          <img
            class="mr-2"
            src="/keplr.png"
            width="20"
            height="20"
          >
            Connect keplr
          </v-btn>
        <div v-else>
          {{ accounts[0].address }}
          <v-btn
            v-if="logged"
            class="ma-2"
            :loading="loadingRefresh"
            :disabled="loadingRefresh"
            @click="refresh"
          >
            <v-icon class="mr-2">mdi-refresh</v-icon> Refresh
          </v-btn>
          <v-btn
            v-if="logged"
            class="ma-2"
            @click="logoutNow"
          >
            <v-icon>mdi-logout</v-icon>
          </v-btn>
        </div>
      </v-container>
    </v-app-bar>

    <v-main class="grey lighten-3">
      <v-container>

        <v-row>
          <v-col
            cols="12"
            md="4"
          >
            <v-card
              class="pa-2"
              outlined
              rounded="lg"
            >
            <v-card-title>My wallet 
                <SendModal 
                  v-if="logged"
                  :chainIdProps="cosmosConfig[0].coinLookup.addressPrefix"
                  :amountAvailable="(balances / 1000000)"
                  :coinIcon="cosmosConfig[0].coinLookup.icon"
                />            
            <v-spacer></v-spacer>

            <div v-if="logged">
              
              {{ (balances / 1000000).toFixed(2) }} {{ cosmosConfig[0].coinLookup.viewDenom }}
              
            </div>
            <div v-else>0 {{ cosmosConfig[0].coinLookup.viewDenom }}</div>
            </v-card-title>

            </v-card>
          </v-col>
          <v-col
            cols="12"
            md="4"
          >
            <v-card
              class="pa-2"
              outlined
              rounded="lg"
            >
            <v-card-title>My reward
            <v-spacer></v-spacer>
 
            <div v-if="logged && delegationsLoaded && delegations.length > 0 && !isNaN(rewards.amount)">{{ (rewards.amount / 1000000).toFixed(2) }} {{ cosmosConfig[0].coinLookup.viewDenom }}</div>
            <div v-else>0 {{ cosmosConfig[0].coinLookup.viewDenom }}</div>
            </v-card-title>


            </v-card>
          </v-col>
          <v-col
            cols="12"
            md="4"
          >
            <v-card
              class="pa-2"
              outlined
              rounded="lg"
            >
            <v-card-title>Chain info
            <v-spacer></v-spacer>Height: {{ lastBlock }}
            </v-card-title>


            </v-card>
          </v-col>
        </v-row>

        <v-row>
          <v-col
            cols="12"
            md="6"
          >
            <v-card
              class="pa-2"
              outlined
              rounded="lg"
            >
            <v-card-title>My delegations</v-card-title>
            <v-card-text>
              <v-simple-table>
                <template v-slot:default>
                  <thead>
                    <tr v-if="logged && delegationsLoaded">
                      <th class="text-left">
                        Name
                      </th>
                      <th class="text-left">
                        Reward
                      </th>
                      <th class="text-left">
                        Redelegate
                      </th>
                      <th class="text-left">
                        Undelegate
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr
                      v-if="logged && delegationsLoaded"
                      v-for="item in delegations"
                      :key="item.op_address"
                    >
                      <td>
                      <v-avatar

                        class="mr-3"
                        color="grey darken-1"
                        size="32"
                      >
                        <img
                          :src="cosmosConfig[0].coinLookup.icon"
                          alt="cerberus"
                        >
                      </v-avatar>
                      {{ item.validatorName }}
                      </td>
                      <td>

                        <div v-if="!isNaN(item.reward)">
                        <v-btn
                          icon
                          color="green"
                          @click="getReward(item.op_address)"
                        >
                          <v-icon>mdi-download</v-icon>
                        </v-btn>
                        {{ (item.reward / 1000000).toFixed(2) }} {{ cosmosConfig[0].coinLookup.viewDenom }} </div>
                        <div v-else>0 {{ cosmosConfig[0].coinLookup.viewDenom }}</div>
                        </td>
                      <td>
                        <RedelegateModal
                          :chainIdProps="cosmosConfig[0].coinLookup.addressPrefix"
                          :addressFrom="item.op_address"
                          :amountRe="item.share / 1000000"
                          :validatorName="item.validatorName"
                          :coinIcon="cosmosConfig[0].coinLookup.icon"
                        />
                      </td>
                      <td>
                        <UndelegateModal
                          :chainIdProps="cosmosConfig[0].coinLookup.addressPrefix"
                          :addressFrom="item.op_address"
                          :amountUn="item.share / 1000000"
                          :validatorName="item.validatorName"
                          :coinIcon="cosmosConfig[0].coinLookup.icon"
                        />
                      </td>
                    </tr>
                  </tbody>
                </template>
              </v-simple-table>
            </v-card-text>
            </v-card>
          </v-col>           
<!--          <v-col
            cols="12"
            md="3"
          > 
            <v-card
              class="pa-2"
              outlined
              rounded="lg"
            >          
            <v-card-title>Redelegations</v-card-title>
              <v-simple-table>
                <template v-slot:default>
                  <thead>
                    <tr v-if="logged && delegationsLoaded">
                      <th class="text-left">
                        Name
                      </th>
                      <th class="text-left">
                        Reward
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr
                      v-if="logged"
                      v-for="item in reDelegations"
                      :key="item.validator_dst_address"
                    >
                     
                      <td>
                      <v-avatar

                        class="mr-3"
                        color="grey darken-1"
                        size="32"
                      >
                        <img
                          :src="cosmosConfig[0].coinLookup.icon"
                          alt="cerberus"
                        >
                      </v-avatar>
                      {{ item.validator_src_address }}
                      </td>
                      <td>
                        {{ item.entries[0].redelegation_entry.initial_balance }}
                        
                        </td>
 
                    </tr>
                  </tbody>
                </template>
              </v-simple-table>
            </v-card>
          </v-col>-->
          <v-col
            cols="12"
            md="6"
          > 
            <v-card
              class="pa-2"
              outlined
              rounded="lg"
            >          
            <v-card-title>Others</v-card-title>
            <v-card-text>
              <v-tabs v-model="tab" v-if="logged">
                <v-tab href="#tab-1">
                  Redelegations
                </v-tab>

                <v-tab href="#tab-2">
                  Undelegations
                </v-tab>

              </v-tabs>
              </v-tabs>
              <v-tabs-items v-model="tab" v-if="logged && delegationsLoaded">
                <v-tab-item
                  value="tab-1"
                >
                  <v-card flat>
                    <v-card-text>
                      <v-simple-table>
                        <template v-slot:default>
                          <thead>
                            <tr>
                              <th class="text-left">
                                Name
                              </th>
                              <th class="text-left">
                                Amount
                              </th>
                              <th class="text-left">
                                Completion time
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            <tr
                              v-if="logged"
                              v-for="item in reDelegations"
                              :key="item.amount"
                            >
                            
                              <td>
                              <v-avatar

                                class="mr-3"
                                color="grey darken-1"
                                size="32"
                              >
                                <img
                                  :src="cosmosConfig[0].coinLookup.icon"
                                  alt="cerberus"
                                >
                              </v-avatar>
                              {{ item.validator_src_address }} <v-icon>mdi-ray-start-arrow</v-icon> {{ item.validator_dst_address }}
                              </td>
                              <td>
                                {{ item.amount }} {{ cosmosConfig[0].coinLookup.viewDenom }}                                
                              </td>
                              <td>
                                {{ item.completion_time }}                                
                              </td>        
                            </tr>
                          </tbody>
                        </template>
                      </v-simple-table>                    
                    </v-card-text>
                  </v-card>
                </v-tab-item>
                <v-tab-item
                  value="tab-2"
                >
                  <v-card flat>
                    <v-card-text>
                      <v-simple-table>
                        <template v-slot:default>
                          <thead>
                            <tr v-if="logged && delegationsLoaded">
                              <th class="text-left">
                                Name
                              </th>
                              <th class="text-left">
                                Amount
                              </th>
                              <th class="text-left">
                                Completion time
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            <tr
                              v-if="logged"
                              v-for="item in unbondings"
                              :key="item.validator_src_address"
                            >
                            
                              <td>
                              <v-avatar

                                class="mr-3"
                                color="grey darken-1"
                                size="32"
                              >
                                <img
                                  :src="cosmosConfig[0].coinLookup.icon"
                                  alt="cerberus"
                                >
                              </v-avatar>
                              {{ item.validator_src_address }}
                              </td>
                              <td>
                                {{ item.amount }} {{ cosmosConfig[0].coinLookup.viewDenom }}                                
                              </td>
                              <td>
                                {{ item.completion_time }}                                
                              </td>        
                            </tr>
                          </tbody>
                        </template>
                      </v-simple-table>                      
                    </v-card-text>
                  </v-card>
                </v-tab-item>
              </v-tabs-items>
    
            </v-card-text>
            </v-card>
          </v-col>
       </v-row>
        <!-- Here -->
        <v-row>
          <v-col
            cols="12"
            md="12"
          >
 
            <v-data-table
              :headers="headers"
              :items="validators"
              :items-per-page="5"
              class="elevation-1"
            >
              <template #item.name="{ item }">
                    <v-avatar

                      class="mr-3"
                      color="grey darken-1"
                      size="32"
                    >
                      <img
                        :src="cosmosConfig[0].coinLookup.icon"
                        alt="cerberus"
                      >
                    </v-avatar>              
                  {{ item.name }}
              </template>            
              <template #item.delegate="{ item }">
                  <DelegateModal
                    v-if="logged"
                    :chainIdProps="cosmosConfig[0].coinLookup.addressPrefix"
                    :addressTo="item.op_address"
                    :validatorName="item.name"
                    :balances="balances"
                  />
              </template>  
            </v-data-table>
  
           <!-- <v-simple-table>
              <template v-slot:default>
                <thead>
                  <tr>
                    <th class="text-left">
                      Name
                    </th>
                    <th class="text-left">
                      Operator address
                    </th>
                    <th class="text-left">
                      Delegate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-if="validatorsLoaded"
                    v-for="item in validators"
                    :key="item.name"
                  >
                    <td>
                    <v-avatar

                      class="mr-3"
                      color="grey darken-1"
                      size="32"
                    >
                      <img
                        :src="cosmosConfig[0].coinLookup.icon"
                        alt="cerberus"
                      >
                    </v-avatar>
                    {{ item.name }}
                    </td>
                    <td>{{ item.op_address }}</td>
                    <td>

                  <template >
                  <DelegateModal
                    v-if="logged"
                    :chainIdProps="cosmosConfig[0].coinLookup.addressPrefix"
                    :addressTo="item.op_address"
                    :validatorName="item.name"
                    :balances="balances"
                  />

                  </template>
                    </td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>-->
 
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  <v-footer
    color="white"
    padless
  >
    <v-row
      justify="center"
      no-gutters
    >

      <v-col
        class="white py-4 text-center black--text"
        cols="12"
      >
        cerberus.zone — {{ new Date().getFullYear() }} - v1.1.0
      </v-col>
    </v-row>
  </v-footer>
  </v-app>
</template>

<script>
import { mapState } from 'vuex'
import cosmosConfig from '~/cosmos.config'
import {
	assertIsDeliverTxSuccess,
	SigningStargateClient,
} from '@cosmjs/stargate'

  export default {
    data: () => ({
      tab: null,
        headers: [
          { text: 'Name', value: 'name' },
          { text: 'Commission', value: 'crate' },
          { text: 'Operator address', value: 'op_address' },
          { text: 'Delegate', value: 'delegate' },
        ],      
      links: [
        {
          name: 'Dashboard',
          link: '/'
        }/*,
        {
          name: 'Proposals',
          link: '/proposals'
        }*/
      ],
      cosmosConfig: cosmosConfig,
      loadingRefresh: false,
      interval: {},
      timerValue: 0,
    }),
    computed: {
      ...mapState('keplr', [`accounts`, `initialized`, `error`, `logged`, `logout`]),
      ...mapState('data', [`balances`, 'validators', 'delegations', 'delegationsLoaded', 'validatorsLoaded', 'rewards', 'reDelegations', 'unbondings', 'lastBlock']),
    },
    async mounted() {
      this.interval = setInterval(async () => {
        if (this.timerValue === 100) {
          await this.$store.dispatch('data/getLastBlock')
          // console.log(this.logged)
          if (this.logged === true)
            this.$store.dispatch('data/refresh', this.accounts[0].address)        
          return (this.timerValue = 0)
        }
        this.timerValue += 10
      }, 1000)
      
      await this.$store.dispatch('data/getLastBlock')
 
      
      await this.$store.dispatch('data/getAllValidators')
      window.addEventListener("keplr_keystorechange", async () => {
        await this.$store.dispatch('keplr/connectWallet', cosmosConfig[0])
        //this.$store.dispatch('data/getAccountInfo', account[0].address)
        this.$store.dispatch('data/refresh', this.accounts[0].address)
      })
    },
    methods: {
      connectKeplr: async function (event) {
        await this.$store.dispatch('keplr/connectWallet', cosmosConfig[0])
        await this.$store.dispatch('data/getWalletInfo', this.accounts[0].address)
        await this.$store.dispatch('data/getDelegations', this.accounts[0].address)
        await this.$store.dispatch('data/getAllProposals')
        await this.$store.dispatch('data/getReDelegations', this.accounts[0].address)
        await this.$store.dispatch('data/getUnbondings', this.accounts[0].address)
        await this.$store.dispatch('data/getLastBlock')
        //await this.$store.dispatch('data/refresh', this.accounts[0].address)

        // this.address = this.accounts
        // this.$router.push({path: "/"})
      },
 
      async refresh() {
        this.loadingRefresh = true
        await this.$store.dispatch('data/refresh', this.accounts[0].address)
        // await this.$store.dispatch('test/refresh')
        this.loadingRefresh = false
        // console.log(this.accounts)
      },
      getReward(addrValidator) {
        (async () => {
            const chainId = cosmosConfig[0].chainId;
            await window.keplr.enable(chainId);
            const offlineSigner = await window.getOfflineSignerAuto(chainId);

            const accounts = await offlineSigner.getAccounts();
            const client = await SigningStargateClient.connectWithSigner(
              cosmosConfig[0].rpcURL,
              offlineSigner
            )
              const fee = {
                amount: [
                  {
                    denom: cosmosConfig[0].chainDenom,
                    amount: '5000',
                  },
                ],
                gas: '200000',
              }
            try {
              const result = await client.withdrawRewards(accounts[0].address, addrValidator, fee, '')
              assertIsDeliverTxSuccess(result)
              await this.$store.dispatch('data/refresh', accounts[0].address)
            } catch (error) {
              console.error(error);
            }
        })();
      },
      logoutNow() {

        this.$store.dispatch('keplr/logout')

        // this.$router.push({path: "login"})
      },
    },
  }
</script>
<style scoped>
.v-progress-circular {
  margin: 1rem;
}
</style>

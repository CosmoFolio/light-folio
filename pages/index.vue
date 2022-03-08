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
            src="https://cerberus-chain.s3.us-east-2.amazonaws.com/transparent_logo_no_text.png"
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
            <v-spacer></v-spacer>

            <div v-if="logged">
              {{ (balances / 1000000).toFixed(2) }} CRBRUS
            </div>
            <div v-else>0 CRBRUS</div>
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
 
            <div v-if="logged && delegationsLoaded && delegations.length > 0 && !isNaN(rewards.amount)">{{ (rewards.amount / 1000000).toFixed(2) }} CRBRUS</div>
            <div v-else>0 CRBRUS</div>
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
            <v-spacer></v-spacer>No data
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
                        {{ (item.reward / 1000000).toFixed(2) }} CRBRUS</div>
                        <div v-else>0 CRBRUS</div>
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
            </v-card>
          </v-col>

          <v-col
            cols="12"
            md="6"
          >
            <v-card
              class="pa-2"
              outlined
              rounded="lg"
            >
            <v-card-title>All validators</v-card-title>
            <v-simple-table>
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
            </v-simple-table>
            </v-card>
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
    }),
    computed: {
      ...mapState('keplr', [`accounts`, `initialized`, `error`, `logged`, `logout`]),
      ...mapState('data', [`balances`, 'validators', 'delegations', 'delegationsLoaded', 'validatorsLoaded', 'rewards']),
    },
    async mounted() {
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
        //await this.$store.dispatch('data/refresh', this.accounts[0].address)

        // this.address = this.accounts
        // this.$router.push({path: "/"})
      },
      delegateCoin: async function (event) {
        console.log('delegate')
      },
      async refresh() {
        this.loadingRefresh = true
        await this.$store.dispatch('data/refresh', this.accounts[0].address)
        // await this.$store.dispatch('test/refresh')
        this.loadingRefresh = false
        console.log(this.accounts)
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

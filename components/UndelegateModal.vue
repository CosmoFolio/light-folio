<template>

    <v-dialog
      v-model="dialog"
      max-width="600px"
    >

        <template v-slot:activator="{ on, attrs }">
          <v-btn
            icon
            color="red"
            v-bind="attrs"
            v-on="on"
            :disabled="!enableModal"
          >
          <v-icon>mdi-close-circle-multiple-outline</v-icon>
          </v-btn>
        </template>


      <v-card>
        <v-card-title>
          <span class="text-h5">Undelegate from {{ validatorName }}</span>
        </v-card-title>
        <v-card-text>
        <v-form
          ref="form"
          v-model="dislableSend"
          lazy-validation
        >
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-col class="text-right">
                  <v-chip
                    @click="getQuarter"
                  >
                  1/4
                  </v-chip>
                  <v-chip
                    @click="getHalf"
                  >
                  1/2
                  </v-chip>
                  <v-chip
                    @click="getMax"
                  >
                  Max
                  </v-chip>
                </v-col>

                <v-text-field
                  v-model="amount"
                  outlined
                  label="Amount*"
                  :rules="(!loadingInput) ? amountRules : ''"
                  type="text"
                >
                  <template v-slot:append>
                    <img
                      width="24"
                      height="24"
                      :srcset='coinIcon'
                      alt=""
                      :class="`rounded-xl`"
                    >
                  </template>
                </v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="address"
                  label="Address from*"
                  :rules="addressRules"
                  required
                  outlined
                ></v-text-field>
              </v-col>
              <!--<v-col cols="12">
                <v-text-field
                  v-model="amount"
                  label="Amount*"
                  :rules="amountRules"
                  required
                ></v-text-field>
              </v-col>-->
              <v-col cols="12">
                <v-text-field
                  v-model="memo"
                  label="Memo"
                  required
                  outlined
                ></v-text-field>
              </v-col>
              <v-col
                cols="12"
                sm="6"
              >
              </v-col>
            </v-row>
          </v-container>
          <small>*indicates required field</small>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="darken-1"
            @click="dialog = false"
          >
            Close
          </v-btn>
          <v-btn
            :disabled="!dislableSend"
            :loading="loading"
            color="darken-1"
            @click="validate"
          >
            Undelegate
          </v-btn>
        </v-card-actions>
      </v-card>

    </v-dialog>

</template>

<script>
import { mapState } from 'vuex'
import { bech32 } from 'bech32'
import cosmosConfig from '~/cosmos.config'
import {
  defaultRegistryTypes,
	assertIsDeliverTxSuccess,
	SigningStargateClient,
} from '@cosmjs/stargate'

  function bech32Validation(address) {
    try {
      const words = bech32.decode(address)
      Buffer.from(bech32.fromWords(words.words)).toString(`hex`)
      return true
    } catch (error) {
      return false
    }
  }
  function prefixValidation(address) {
    if (address && address.startsWith(this.network.addressPrefix)) {
      return true
    } else {
      return false
    }
  }
  export default {
    props: ['chainIdProps', 'addressFrom', 'amountUn', 'validatorName', 'coinIcon'],
    data: (instance) => ({
      dialog: false,
      dislableSend: true,
      address: instance.addressFrom,
      amount: instance.amountUn,
      addressRules: [
        v => !!v || 'Address is required',
        v => v.startsWith(instance.chainIdProps.toLowerCase() + 'valoper') || 'Address must start with "' + instance.chainIdProps.toLowerCase() + 'valoper"',
        v => bech32Validation(v) || 'Bad address (not bech32)',
      ],
      amountRules: [
        v => !!v || 'Amount is required',
        v => !isNaN(v) || 'Amount must be number',
        v => v <= instance.amountUn || 'Amount equal or above delegated amount (' + instance.amountUn + ')',
      ],
      memo: '',
      loading: false,
      loadingInput: false,
      config: cosmosConfig
    }),
    computed: {
      ...mapState('data', ['chainId', `balances`]),
      enableModal: function () {
        var isDeleg = false
        if (this.amountUn !== '0')
          isDeleg =  true

        return isDeleg
      }
    },
    methods: {
      getMax () {
        this.amount = this.amountUn
      },
      getHalf () {
        this.amount = this.amountUn / 2
      },
      getQuarter () {
        this.amount = this.amountUn / 4
      },
      validate () {
        if (this.$refs.form.validate() === true) {
          (async () => {
            this.loading = true

            const chainId = cosmosConfig[0].chainId;
            await window.keplr.enable(chainId);
            const offlineSigner = await window.getOfflineSignerAuto(chainId);
            const accounts = await offlineSigner.getAccounts();

            const client = await SigningStargateClient.connectWithSigner(
              cosmosConfig[0].rpcURL,
              offlineSigner
            )
            const convertAmount = Number(this.amount).toFixed(2) * 1000000
            const amountFinal = {
              denom: cosmosConfig[0].coinLookup.chainDenom,
              amount: convertAmount.toString(),
            }
            const fee = {
              amount: [
                {
                  denom: cosmosConfig[0].coinLookup.chainDenom,
                  amount: '5000',
                },
              ],
              gas: '300000', // Need more gas for redelegation!
            }

            try {

              const result = await client.undelegateTokens(
                accounts[0].address,
                this.address,
                amountFinal,
                fee,
                ''
              )
              assertIsDeliverTxSuccess(result)
              this.dialog = false
              this.loading = false
              await this.$store.dispatch('data/refresh', accounts[0].address)
            } catch (error) {
                console.error(error);
                this.loading = false
            }
          })();
        }
      },
    },
  }
</script>


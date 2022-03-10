<template>
  <div>
    <v-dialog
      v-model="dialog"
      max-width="600px"
    >
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          icon
          v-bind="attrs"
          v-on="on"
          x-small
          plain
          class="ma-2"
        >
          <v-icon>mdi-send</v-icon>
        </v-btn>
        
      </template>
      <v-card>
        <v-card-title>
          <span class="text-h5">Send transaction</span>
          <v-spacer></v-spacer>
          <v-icon class="mr-2" @click="dialog = false">mdi-close-circle</v-icon>
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
                  label="Address*"
                  :rules="addressRules"
                  required  
                  outlined
                ></v-text-field>
              </v-col>              
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
            :disabled="!dislableSend"
            :loading="loading"
            color="darken-1"
            @click="validate"
          >
            Send Tx
          </v-btn> 
 
          </v-card-actions>
      </v-card>      
    </v-dialog>
  
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { bech32 } from 'bech32'
import { notifWaiting, notifError, notifSuccess } from '~/libs/notifications'
import cosmosConfig from '~/cosmos.config'
import {
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
    props: ['chainIdProps', 'amountAvailable', 'coinIcon'],
    data: (instance) => ({
      e1: 1,
      eError: true,
      dialog: false,
      dialogStepper: false,
      dislableSend: true,
      address: '',
      addressRules: [
        v => !!v || 'Address is required',
        v => v.startsWith(instance.chainIdProps.toLowerCase()) || 'Address must start with "' + instance.chainIdProps.toLowerCase() + '"',
        v => bech32Validation(v) || 'Bad address (not bech32)',
      ],
      amount: '',
      amountRules: [
        v => !!v || 'Amount is required',
        //v => !isNaN(v) || 'Amount must be number',
        v => v <= instance.amountAvailable || 'Amount equal or above available amount (' + instance.amountAvailable + ')',
      ],
      memo: '',
      loading: false,
      loadingInput: false,
      message: 'Hey!',
      config: cosmosConfig 
    }),
    computed: {
      ...mapState('data', ['chainId', `balances`]),
    }, 
    methods: {
      getMax () {
        this.amount = this.amountAvailable
      },
      getHalf () {
        this.amount = this.amountAvailable / 2
      },
      getQuarter () {
        this.amount = this.amountAvailable / 4 
      },      
      test () {  
        this.dialogStepper = true
      },
      validate () {    
        if (this.$refs.form.validate() === true) {
          (async () => {
            this.loading = true
            
            const chainId = cosmosConfig[this.chainId].chainId;
            await window.keplr.enable(chainId);
            const offlineSigner = await window.getOfflineSignerAuto(chainId);
            const accounts = await offlineSigner.getAccounts();

            const client = await SigningStargateClient.connectWithSigner(
              cosmosConfig[this.chainId].rpcURL,
              offlineSigner
            )
            const convertAmount = this.amount * 1000000
            const amount = {
              denom: cosmosConfig[this.chainId].coinLookup.chainDenom,
              amount: convertAmount.toString(),
            }
            const fee = {
              amount: [
                {
                  denom: cosmosConfig[this.chainId].chainDenom,
                  amount: '5000',
                },
              ],
              gas: '200000',
            }
 
            try {         
              
              const result = await client.sendTokens(accounts[0].address, this.address, [amount], fee, this.memo)   
              this.e1 = 2
              assertIsDeliverTxSuccess(result)
              
              // this.dialog = false
              this.loading = false      
              await this.$store.dispatch('data/refresh', accounts[0].address)    
              this.e1 = 3
            } catch (error) {
                console.error(error);
                this.eError = false
                this.loading = false
            }
          })();
        }
      },
    },
  }  
</script>

<style>
.vuetify-logo {
  height: 180px;
  width: 180px;
  transform: rotateY(560deg);
  animation: turn 3.5s ease-out forwards 1s;
}

@keyframes turn {
  100% {
    transform: rotateY(0deg);
  }
}
</style>

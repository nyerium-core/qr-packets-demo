<script lang="ts">
import Vue from 'src/vue-ts'
import EthTxList from "./EthTxList.vue"
import EosTxList from "./EosTxList.vue"
import { generate } from "./bbhoc"

export default generate({
	eth: EthTxList,
	eos: EosTxList
})
</script>

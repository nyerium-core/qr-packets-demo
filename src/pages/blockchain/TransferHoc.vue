<script lang="ts">
import Vue from 'src/vue-ts'
import EthTransfer from "./EthTransfer.vue"
import EosTransfer from "./EosTransfer.vue"
import { generate } from "./bbhoc"

export default generate({
	eth: EthTransfer,
	eos: EosTransfer,
})
</script>

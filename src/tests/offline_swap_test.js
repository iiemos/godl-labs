// Offline smoke tests for swap calculations (no blockchain access).
// This standalone script validates core calculation logic independently of wagmi/ethers.
// Node.js must be able to require ES modules if needed; this file uses CommonJS for simplicity.

const USD1_TO_MGN = 0.4528
const MGN_TO_USD1 = 1 / USD1_TO_MGN

function computeToAmount(fromToken, toToken, fromAmount, rate) {
  if (!fromAmount || !rate) return ''
  const amountIn = parseFloat(fromAmount)
  if (Number.isNaN(amountIn)) return ''
  return (amountIn * rate).toFixed(6)
}

function computeMinOut(toAmount, slippagePct) {
  if (!toAmount) return '0.0000'
  const v = parseFloat(toAmount) * (1 - (slippagePct / 100))
  return v.toFixed(4)
}

function runScenario(s) {
  const { fromToken, toToken, fromAmount, rate } = s
  const toAmount = computeToAmount(fromToken, toToken, fromAmount, rate)
  const minOut = computeMinOut(toAmount, s.slippage || 0.5)
  return { toAmount, minOut }
}

function main() {
  // scenario 1: USDT -> MOON 1 USDT
  const s1 = { fromToken: 'USDT', toToken: 'MOON', fromAmount: '10', rate: USD1_TO_MGN, slippage: 0.5 }
  const r1 = runScenario(s1)
  console.log('Scenario USDT->MOON:', r1)

  // scenario 2: MOON -> USDT 5 MG N
  const s2 = { fromToken: 'MOON', toToken: 'USDT', fromAmount: '2', rate: MGN_TO_USD1, slippage: 0.8 }
  const r2 = runScenario(s2)
  console.log('Scenario MOON->USDT:', r2)
}

main()

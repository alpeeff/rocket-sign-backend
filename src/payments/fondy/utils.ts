import * as fondyUtils from 'cloudipsp-node-js-sdk/lib/util'
import { FondyCurrency } from 'src/types/fondy/types'

export function generateSignature(
  secretKey: string,
  orderId: string,
  amount: number,
  currency: FondyCurrency,
  orderDesc?: string,
) {
  const arr = [amount, currency, amount.toString(), orderDesc, orderId].filter(
    (x) => Boolean(x),
  )
  const joined = arr.join('|')

  return fondyUtils.genSignatureV2(joined, secretKey)
}

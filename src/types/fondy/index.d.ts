declare module 'cloudipsp-node-js-sdk' {
  export interface CloudIpspOptions {
    protocol?: string
    merchantId: number
    baseUrl?: string
    secretKey: string
    creditKey?: string
    contentType?: string
    timeout?: number
  }

  export = class CloudIpsp {
    constructor(options: CloudIpspOptions)

    getImportantParams(data: any): any
    getOrderId(): string
    isValidResponse(data: any, credit?: boolean): boolean
    Checkout(
      data: FondyCheckoutDTO,
    ): Promise<FondyCheckoutIntermediateSuccessResponseDTO>
    CheckoutToken(data: any): Promise<any>
    Verification(data: any): Promise<any>
    Capture(data: FondyCaptureDTO): Promise<FondyCaptureResponseDTO>
    Recurring(data: any): Promise<any>
    Reverse(data: FondyReverseDTO): Promise<FondyReverseResponseDTO>
    Status(data: FondyStatusDTO): Promise<FondyStatusResponseDTO>
    P2pcredit(data: any): Promise<any>
    TransactionList(data: any): Promise<any>
    Reports(data: any): Promise<any>
    PciDssOne(data: any): Promise<any>
    PciDssTwo(data: any): Promise<any>
    Settlement(data: any): Promise<any>
    Subscription(data: any): Promise<any>
    SubscriptionActions(data: any): Promise<any>
  }

  export interface CheckoutData {
    order_id: string
    order_desc: string
    currency: string
    amount: number
    response_url: string
    server_callback_url: string
    lang?: string
    product_id?: number
    recurring_data?: RecurringData
    verification?: boolean
  }

  export interface RecurringData {
    recurring_lifetime: string
    recurring_frequency: string
  }

  export interface CheckoutResponse {
    checkout_url: string
    payment_id: string
  }

  export interface CallbackData {
    signature: string
    data: string
  }

  export interface CallbackResponse {
    [key: string]: any
  }

  export interface ReverseData {
    order_id: string
    amount?: number
  }

  export interface ReverseResponse {
    [key: string]: any
  }

  export interface CaptureData {
    order_id: string
    amount: number
  }

  export interface CaptureResponse {
    [key: string]: any
  }

  export interface RefundData {
    order_id: string
    amount: number
    comment?: string
  }

  export interface RefundResponse {
    [key: string]: any
  }

  /**
   * @see https://docs.fondy.eu/ru/docs/page/3/#chapter-3-1
   */
  export interface FondyCheckoutDTO {
    order_id: string
    merchant_id: number
    order_desc: string
    signature: string
    amount: number
    currency: FondyCurrency
    version: '1.0.1'
    response_url?: string
    server_callback_url?: string
    payment_systems?: 'card'

    /**
     * @example monobank_ua
     */
    payment_method?: string
    default_payment_system?: string
    lifetime?: number
    merchant_data?: string
    preauth?: FondyFlag
    sender_email?: string
    delayed?: FondyFlag
    lang?: FondyLang
    product_id?: string
    required_rectoken?: FondyFlag
    verification?: FondyFlag
    verification_type?: 'amount' | 'card'
    rectoken?: string
    receiver_rectoken?: string
    design_id?: string
    subscription?: FondyFlag
    subscription_callback_url?: string
  }

  export interface FondyCheckoutIntermediateSuccessResponseDTO {
    response_status: 'success'
    checkout_url: string
    payment_id: number
  }

  export interface FondyCheckoutIntermediateFailureResponseDTO {
    response_status: 'failure'
    error_code: string
    error_message: number
  }

  export type FondyCheckoutIntermediateResponseDTO =
    | FondyCheckoutIntermediateSuccessResponseDTO
    | FondyCheckoutIntermediateFailureResponseDTO

  export interface FondyCaptureDTO {
    order_id: string
    merchant_id: number
    // signature: string
    version: '1.0'
    amount: number
    currency: FondyCurrency
  }

  export interface FondyCaptureResponseSuccessDTO {
    order_id: string
    merchant_id: number
    capture_status: 'captured' | 'hold'
    response_status: 'success'
  }

  export type FondyCaptureResponseFailureDTO =
    FondyCheckoutIntermediateFailureResponseDTO

  export type FondyCaptureResponseDTO =
    | FondyCaptureResponseSuccessDTO
    | FondyCaptureResponseFailureDTO

  export interface FondyReverseDTO {
    order_id: string
    merchant_id: number
    version: '1.0.1'
    amount: number
    currency: FondyCurrency
    comment?: string
  }

  export interface FondyReverseResponseSuccessDTO {
    order_id: string
    merchant_id: number
    reverse_status: 'created' | 'declined' | 'approved'
    response_status: 'success'
  }

  export type FondyReverseResponseFailureDTO =
    FondyCheckoutIntermediateFailureResponseDTO

  export type FondyReverseResponseDTO =
    | FondyCaptureResponseSuccessDTO
    | FondyCaptureResponseFailureDTO

  export interface FondyStatusDTO {
    order_id: string
    merchant_id: number
    // signature: string
    version: '1.0'
  }

  export class FondyStatusResponseSuccessDTO {
    signature: string
    rrn: string
    masked_card: string
    sender_cell_phone: string
    sender_account: string
    currency: string
    fee: string
    reversal_amount: string
    settlement_amount: string
    actual_amount: string
    response_description: string
    sender_email: string
    order_status: FondyOrderStatus
    response_status: string
    order_time: string
    actual_currency: string
    order_id: string
    tran_type: string
    eci: string
    settlement_date: string
    payment_system: string
    approval_code: string
    merchant_id: number
    settlement_currency: string
    payment_id: number
    card_bin: number
    response_code: string
    card_type: string
    amount: string
    product_id: string
    merchant_data: string
    rectoken: string
    rectoken_lifetime: string
    verification_status: string
    parent_order_id: string
    response_signature_string: string
  }

  export type FondyStatusResponseFailureDTO =
    FondyCheckoutIntermediateFailureResponseDTO

  export type FondyStatusResponseDTO =
    | FondyStatusResponseSuccessDTO
    | FondyStatusResponseFailureDTO
}

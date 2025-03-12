import { env } from "./env"

// Types
export type PaystackInitializeResponse = {
  status: boolean
  message: string
  data: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

export type PaystackVerifyResponse = {
  status: boolean
  message: string
  data: {
    id: number
    domain: string
    status: string
    reference: string
    amount: number
    message: string
    gateway_response: string
    paid_at: string
    created_at: string
    channel: string
    currency: string
    ip_address: string
    metadata: any
    customer: {
      id: number
      first_name: string
      last_name: string
      email: string
      customer_code: string
      phone: string
      metadata: any
      risk_action: string
    }
  }
}

export type InitiatePaymentParams = {
  email: string
  amount: number
  reference?: string
  callback_url?: string
  metadata?: Record<string, any>
}

// Initialize payment
export async function initiatePayment(params: InitiatePaymentParams): Promise<{
  authorization_url: string
  reference: string
}> {
  const { email, amount, reference = `REF-${Date.now()}`, callback_url, metadata } = params

  try {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount, // amount in kobo (smallest currency unit)
        reference,
        callback_url,
        metadata,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to initialize payment")
    }

    const data: PaystackInitializeResponse = await response.json()

    if (!data.status) {
      throw new Error(data.message || "Failed to initialize payment")
    }

    return {
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    }
  } catch (error: any) {
    console.error("Error initializing payment:", error)
    throw new Error(error.message || "Failed to initialize payment")
  }
}

// For backward compatibility
export const initializePayment = initiatePayment

// Verify payment
export async function verifyPayment(reference: string): Promise<{
  status: string
  reference: string
  amount: number
  paid_at: string | null
  metadata: any
}> {
  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to verify payment")
    }

    const data: PaystackVerifyResponse = await response.json()

    if (!data.status) {
      throw new Error(data.message || "Failed to verify payment")
    }

    return {
      status: data.data.status,
      reference: data.data.reference,
      amount: data.data.amount / 100, // Convert from kobo to naira
      paid_at: data.data.paid_at || null,
      metadata: data.data.metadata,
    }
  } catch (error: any) {
    console.error("Error verifying payment:", error)
    throw new Error(error.message || "Failed to verify payment")
  }
}


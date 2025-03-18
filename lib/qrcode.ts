import QRCode from "qrcode"

export async function generateQRCode(data: string): Promise<string> {
  try {
    // Generate QR code as data URL
    const url = await QRCode.toDataURL(data, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 300,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })

    return url
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Error generating QR code:", error)
    throw error
  }
}


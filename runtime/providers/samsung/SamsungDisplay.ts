const SAMSUNG_DLNA_PORT = 9197

export async function displaySamsungImage(
  address: string,
  imageUrl: string,
): Promise<void> {
  await sendAvTransportCommand(
    address,
    'SetAVTransportURI',
    `
      <InstanceID>0</InstanceID>
      <CurrentURI>${escapeXml(imageUrl)}</CurrentURI>
      <CurrentURIMetaData></CurrentURIMetaData>
    `,
  )

  await sendAvTransportCommand(
    address,
    'Play',
    `
      <InstanceID>0</InstanceID>
      <Speed>1</Speed>
    `,
  )
}

async function sendAvTransportCommand(
  address: string,
  action: string,
  body: string,
): Promise<void> {
  const response = await fetch(
    `http://${address}:${SAMSUNG_DLNA_PORT}/upnp/control/AVTransport1`,
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'text/xml; charset="utf-8"',
        SOAPAction:
          `"urn:schemas-upnp-org:service:AVTransport:1#${action}"`,
      },
      body: createSoapEnvelope(
        action,
        body,
      ),
    },
  )

  if (!response.ok) {
    const responseText =
      await response.text()

    throw new Error(
      `Samsung ${action} failed with HTTP ${response.status}: ${responseText}`,
    )
  }
}

function createSoapEnvelope(
  action: string,
  body: string,
): string {
  return `<?xml version="1.0"?>
<s:Envelope
  xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"
  s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"
>
  <s:Body>
    <u:${action}
      xmlns:u="urn:schemas-upnp-org:service:AVTransport:1"
    >
      ${body}
    </u:${action}>
  </s:Body>
</s:Envelope>`
}

function escapeXml(
  value: string,
): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}